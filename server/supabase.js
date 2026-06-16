import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env and fill in your Supabase project credentials.",
  );
  process.exit(1);
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const DEFAULT_ASPECTS = [
  "Kualitas layanan",
  "Ketepatan waktu",
  "Keramahan staf",
  "Kebersihan toko",
  "Transparansi harga",
];

export function mapProfile(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    businessName: row.business_name,
    aspects: row.aspects ?? [...DEFAULT_ASPECTS],
  };
}

export function mapFeedback(row) {
  return {
    id: row.id,
    businessName: row.business_name,
    consumerName: row.consumer_name,
    isAnonymous: row.is_anonymous,
    rating: row.rating,
    text: row.text,
    aspects: row.aspects ?? [],
    createdAt: row.created_at,
  };
}

import { AUTH_COOKIE_NAME } from "./security.js";

export async function getAuthUserFromRequest(req) {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  const headerAuth = req.headers.authorization ?? "";
  const headerToken = headerAuth.startsWith("Bearer ") ? headerAuth.slice(7) : null;
  const token = cookieToken || headerToken;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function getProfileByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findProfileByBusinessName(businessName) {
  const trimmed = businessName.trim();
  if (!trimmed) return null;

  const { data, error } = await supabaseAdmin
    .rpc("find_profile_by_business_name", { p_business_name: trimmed })
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function isUsernameTaken(username) {
  const { data, error } = await supabaseAdmin.rpc("profile_username_taken", {
    p_username: username.trim(),
  });

  if (error) throw error;
  return Boolean(data);
}

export async function fetchOwnerFeedbacks(userId) {
  const { data, error } = await supabaseAdmin
    .from("feedbacks")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
