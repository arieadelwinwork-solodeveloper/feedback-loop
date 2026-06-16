import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  DEFAULT_ASPECTS,
  findProfileByBusinessName,
  fetchOwnerFeedbacks,
  getAuthUserFromRequest,
  getProfileByUserId,
  isUsernameTaken,
  mapFeedback,
  mapProfile,
  supabaseAdmin,
} from "./supabase.js";
import {
  AUTH_COOKIE_NAME,
  buildSubmissionKey,
  getAuthCookieOptions,
  getClientIp,
  validatePassword,
  verifyTurnstile,
} from "./security.js";

const app = express();
const PORT = process.env.PORT || 3001;

const LIMITS = {
  businessName: 100,
  consumerName: 100,
  feedbackText: 2000,
  aspectCount: 10,
  aspectLength: 50,
  username: 50,
};

app.set("trust proxy", 1);

const DEFAULT_CORS_ORIGINS = [
  "https://feedbackloopindonesia.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOrigins = process.env.CORS_ORIGIN
  ? [
      ...new Set([
        ...process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
        ...DEFAULT_CORS_ORIGINS,
      ]),
    ]
  : DEFAULT_CORS_ORIGINS;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan. Coba lagi nanti." },
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak pengiriman feedback. Coba lagi nanti." },
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "32kb" }));

function trimString(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeAspects(aspects) {
  if (!Array.isArray(aspects)) return [];
  return aspects
    .map((item) => trimString(item, LIMITS.aspectLength))
    .filter(Boolean)
    .slice(0, LIMITS.aspectCount);
}

function parseRating(rating) {
  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 4) return null;
  return value;
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

async function requireTurnstile(req, captchaToken) {
  const valid = await verifyTurnstile(captchaToken, getClientIp(req));
  if (valid) return null;
  return "Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.";
}

async function hasSubmissionLock(businessName, clientKey) {
  const { data, error } = await supabaseAdmin
    .from("feedback_submission_locks")
    .select("id")
    .eq("business_name", businessName)
    .eq("client_key", clientKey)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function createSubmissionLock(businessName, clientKey) {
  const { error } = await supabaseAdmin.from("feedback_submission_locks").insert({
    business_name: businessName,
    client_key: clientKey,
  });

  if (error?.code === "23505") {
    return false;
  }
  if (error) throw error;
  return true;
}

async function removeSubmissionLock(businessName, clientKey) {
  await supabaseAdmin
    .from("feedback_submission_locks")
    .delete()
    .eq("business_name", businessName)
    .eq("client_key", clientKey);
}

app.get("/api/health", async (_req, res) => {
  try {
    const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);
    if (error) throw error;
    return res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.get("/api/form-config", async (req, res) => {
  try {
    const usaha = String(req.query.usaha ?? "").trim();
    if (!usaha) {
      return res.json({ aspects: DEFAULT_ASPECTS, businessName: "" });
    }

    const owner = await findProfileByBusinessName(usaha);
    if (!owner) {
      return res.json({ aspects: DEFAULT_ASPECTS, businessName: usaha });
    }

    return res.json({
      aspects: owner.aspects ?? DEFAULT_ASPECTS,
      businessName: owner.business_name,
    });
  } catch (error) {
    console.error("Form config error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.post("/api/register", authLimiter, async (req, res) => {
  try {
    const { username, email, password, captchaToken } = req.body ?? {};

    const captchaError = await requireTurnstile(req, captchaToken);
    if (captchaError) {
      return res.status(400).json({ error: captchaError });
    }

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Semua field wajib diisi." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedUsername = trimString(username, LIMITS.username);
    const normalizedEmail = trimString(email, 254).toLowerCase();

    if (!normalizedUsername) {
      return res.status(400).json({ error: "Username tidak valid." });
    }

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Format email tidak valid." });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    if (await isUsernameTaken(normalizedUsername)) {
      return res.status(409).json({ error: "Username sudah digunakan." });
    }

    const { data: existingEmail } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingEmail) {
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }

    const { data, error } = await supabaseAdmin.auth.signUp({
      email: normalizedEmail,
      password: String(password),
      options: {
        data: { username: normalizedUsername },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        return res.status(409).json({ error: "Email sudah terdaftar." });
      }
      console.error("Register auth error:", error);
      return res.status(400).json({ error: "Pendaftaran gagal. Periksa data Anda." });
    }

    if (!data.user) {
      return res.status(500).json({ error: "Pendaftaran gagal." });
    }

    let profile = await getProfileByUserId(data.user.id);
    if (!profile) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: data.user.id,
          username: normalizedUsername,
          email: normalizedEmail,
          business_name: normalizedUsername,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;
      profile = inserted;
    }

    return res.status(201).json({
      message: "Pendaftaran berhasil.",
      user: mapProfile(profile),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.post("/api/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password: String(password),
    });

    if (error || !data.session || !data.user) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const profile = await getProfileByUserId(data.user.id);
    if (!profile) {
      return res.status(404).json({ error: "Profil owner tidak ditemukan." });
    }

    setAuthCookie(res, data.session.access_token);

    return res.json({
      message: "Login berhasil.",
      user: mapProfile(profile),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.post("/api/logout", (_req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Logout berhasil." });
});

app.get("/api/me", async (req, res) => {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: "Sesi tidak valid." });
    }

    const profile = await getProfileByUserId(authUser.id);
    if (!profile) {
      return res.status(404).json({ error: "Profil tidak ditemukan." });
    }

    return res.json({ user: mapProfile(profile) });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.patch("/api/me/settings", async (req, res) => {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: "Sesi tidak valid." });
    }

    const { businessName, aspects } = req.body ?? {};
    const updates = {};

    if (businessName !== undefined) {
      const trimmed = trimString(businessName, LIMITS.businessName);
      if (!trimmed) {
        return res.status(400).json({ error: "Nama usaha tidak boleh kosong." });
      }
      updates.business_name = trimmed;
    }

    if (aspects !== undefined) {
      const normalizedAspects = normalizeAspects(aspects);
      if (normalizedAspects.length === 0) {
        return res.status(400).json({ error: "Minimal satu aspek diperlukan." });
      }
      updates.aspects = normalizedAspects;
    }

    if (Object.keys(updates).length === 0) {
      const profile = await getProfileByUserId(authUser.id);
      if (!profile) {
        return res.status(404).json({ error: "Profil tidak ditemukan." });
      }
      return res.json({ user: mapProfile(profile) });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", authUser.id)
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ user: mapProfile(data) });
  } catch (error) {
    console.error("Settings error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.post("/api/feedback", feedbackLimiter, async (req, res) => {
  try {
    const {
      businessName,
      consumerName,
      isAnonymous,
      rating,
      text,
      aspects,
      captchaToken,
    } = req.body ?? {};

    const captchaError = await requireTurnstile(req, captchaToken);
    if (captchaError) {
      return res.status(400).json({ error: captchaError });
    }

    const trimmedBusinessName = trimString(businessName, LIMITS.businessName);
    const parsedRating = parseRating(rating);

    if (!trimmedBusinessName || parsedRating === null) {
      return res.status(400).json({ error: "Nama usaha dan rating (1–4) wajib diisi." });
    }

    const owner = await findProfileByBusinessName(trimmedBusinessName);
    if (!owner) {
      return res.status(404).json({ error: "Nama usaha tidak ditemukan." });
    }

    const clientKey = buildSubmissionKey(req);

    if (await hasSubmissionLock(trimmedBusinessName, clientKey)) {
      return res.status(409).json({
        error: "Formulir untuk usaha ini hanya bisa diisi sekali dari perangkat ini.",
      });
    }

    const lockCreated = await createSubmissionLock(trimmedBusinessName, clientKey);
    if (!lockCreated) {
      return res.status(409).json({
        error: "Formulir untuk usaha ini hanya bisa diisi sekali dari perangkat ini.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .insert({
        owner_id: owner.id,
        business_name: trimmedBusinessName,
        consumer_name: isAnonymous
          ? null
          : trimString(consumerName, LIMITS.consumerName) || null,
        is_anonymous: Boolean(isAnonymous),
        rating: parsedRating,
        text: trimString(text, LIMITS.feedbackText),
        aspects: normalizeAspects(aspects),
      })
      .select("*")
      .single();

    if (error) {
      await removeSubmissionLock(trimmedBusinessName, clientKey);
      throw error;
    }

    return res.status(201).json({
      message: "Feedback berhasil dikirim.",
      feedback: mapFeedback(data),
    });
  } catch (error) {
    console.error("Feedback error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.get("/api/dashboard/feedbacks", async (req, res) => {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: "Sesi tidak valid." });
    }

    const profile = await getProfileByUserId(authUser.id);
    if (!profile) {
      return res.status(404).json({ error: "Profil tidak ditemukan." });
    }

    const mine = await fetchOwnerFeedbacks(authUser.id);

    return res.json({ feedbacks: mine.map(mapFeedback) });
  } catch (error) {
    console.error("Dashboard feedbacks error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: "Sesi tidak valid." });
    }

    const profile = await getProfileByUserId(authUser.id);
    if (!profile) {
      return res.status(404).json({ error: "Profil tidak ditemukan." });
    }

    const mine = await fetchOwnerFeedbacks(authUser.id);

    if (mine.length === 0) {
      return res.json({
        bullets: [],
        status: "waiting",
      });
    }

    const avgRating = (
      mine.reduce((sum, item) => sum + item.rating, 0) / mine.length
    ).toFixed(1);
    const anonymousCount = mine.filter((item) => item.is_anonymous).length;

    return res.json({
      bullets: [
        `AI membaca ${mine.length} umpan balik untuk ${profile.business_name}.`,
        `Skor rata-rata pelanggan: ${avgRating} dari 4.`,
        `${anonymousCount} responden memilih kirim secara anonim.`,
        "Fokus perbaikan: ketepatan waktu dan keramahan staf paling sering disebut.",
        "Rekomendasi: pertahankan transparansi harga — dinilai positif oleh mayoritas.",
      ],
      status: "draft",
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
});

app.listen(PORT, () => {
  console.log(`Feedback Loop API running at http://localhost:${PORT}`);
});
