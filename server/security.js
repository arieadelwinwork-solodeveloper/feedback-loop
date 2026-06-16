import crypto from "crypto";

export const AUTH_COOKIE_NAME = "feedback_loop_session";

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 1000,
  };
}

export function validatePassword(password) {
  const value = String(password);
  if (value.length < 8) {
    return "Password minimal 8 karakter.";
  }
  if (!/[a-zA-Z]/.test(value)) {
    return "Password harus mengandung huruf.";
  }
  if (!/[0-9]/.test(value)) {
    return "Password harus mengandung angka.";
  }
  return null;
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? req.ip;
  }
  return req.ip;
}

export async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({
    secret,
    response: String(token),
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  const data = await response.json();
  return Boolean(data.success);
}

export function buildSubmissionKey(req) {
  const ip = getClientIp(req) ?? "unknown";
  const userAgent = String(req.headers["user-agent"] ?? "").slice(0, 200);
  return crypto
    .createHash("sha256")
    .update(`ip:${ip}|ua:${userAgent}`)
    .digest("hex");
}
