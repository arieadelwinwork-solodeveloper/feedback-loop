import express from "express";
import cors from "cors";
import crypto from "crypto";
import {
  DEFAULT_ASPECTS,
  findProfileByBusinessName,
  fetchOwnerFeedbacks,
  getAuthUserFromRequest,
  getProfileByUserId,
  mapFeedback,
  mapProfile,
  supabaseAdmin,
} from "./supabase.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", 1);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

function buildClientKey(req, clientId) {
  const trimmedId = String(clientId ?? "").trim();
  if (trimmedId) {
    return crypto.createHash("sha256").update(trimmedId).digest("hex");
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string"
    ? forwarded.split(",")[0]?.trim()
    : req.ip;

  return crypto.createHash("sha256").update(`ip:${ip ?? "unknown"}`).digest("hex");
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

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {};

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Semua field wajib diisi." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ error: "Format email tidak valid." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }

    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existingUsername } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", normalizedUsername)
      .maybeSingle();

    if (existingUsername) {
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
      return res.status(400).json({ error: error.message });
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

app.post("/api/login", async (req, res) => {
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

    return res.json({
      message: "Login berhasil.",
      token: data.session.access_token,
      user: mapProfile(profile),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
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
      const trimmed = String(businessName).trim();
      if (!trimmed) {
        return res.status(400).json({ error: "Nama usaha tidak boleh kosong." });
      }
      updates.business_name = trimmed;
    }

    if (aspects !== undefined) {
      if (!Array.isArray(aspects) || aspects.length === 0) {
        return res.status(400).json({ error: "Minimal satu aspek diperlukan." });
      }
      updates.aspects = aspects.map((item) => String(item).trim()).filter(Boolean);
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

app.post("/api/feedback", async (req, res) => {
  try {
    const {
      businessName,
      consumerName,
      isAnonymous,
      rating,
      text,
      aspects,
      clientId,
    } = req.body ?? {};

    if (!businessName?.trim() || !rating) {
      return res.status(400).json({ error: "Nama usaha dan rating wajib diisi." });
    }

    const trimmedBusinessName = String(businessName).trim();
    const clientKey = buildClientKey(req, clientId);

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

    const owner = await findProfileByBusinessName(trimmedBusinessName);

    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .insert({
        owner_id: owner?.id ?? null,
        business_name: trimmedBusinessName,
        consumer_name: isAnonymous
          ? null
          : String(consumerName ?? "").trim() || null,
        is_anonymous: Boolean(isAnonymous),
        rating: Number(rating),
        text: String(text ?? "").trim(),
        aspects: Array.isArray(aspects) ? aspects : [],
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
