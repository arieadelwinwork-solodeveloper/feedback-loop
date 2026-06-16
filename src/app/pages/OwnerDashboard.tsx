import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import { CustomerFormPreview } from "@/app/components/CustomerFormPreview";
import { ScoreTrendChart } from "@/app/components/ScoreTrendChart";
import {
  fetchAiSummary,
  fetchFeedbacks,
  updateSettings,
  type FeedbackEntry,
} from "@/lib/api";
import { buildFormLink } from "@/lib/siteUrl";

export function OwnerDashboard() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState("");
  const [aspects, setAspects] = useState<string[]>([]);
  const [newAspect, setNewAspect] = useState("");
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [savingStoreName, setSavingStoreName] = useState(false);

  const formLink = useMemo(() => buildFormLink(businessName), [businessName]);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setBusinessName(user.businessName);
    setAspects(user.aspects);

    const [{ feedbacks: items }, summary] = await Promise.all([
      fetchFeedbacks(),
      fetchAiSummary(),
    ]);
    setFeedbacks(items);
    setSummaryBullets(summary.bullets);
    setLoadingSummary(false);
  }, [user]);

  useEffect(() => {
    loadDashboard().catch(console.error);
  }, [loadDashboard]);

  const persistAspects = async (nextAspects: string[]) => {
    setAspects(nextAspects);
    const { user: updated } = await updateSettings({ aspects: nextAspects });
    setUser(updated);
  };

  const handleAddAspect = async () => {
    const trimmed = newAspect.trim();
    if (!trimmed || aspects.includes(trimmed)) return;
    const next = [...aspects, trimmed];
    setNewAspect("");
    await persistAspects(next);
  };

  const handleRemoveAspect = async (aspect: string) => {
    if (aspects.length <= 1) return;
    await persistAspects(aspects.filter((item) => item !== aspect));
  };

  const handleCopyLink = async () => {
    if (!formLink) return;
    await navigator.clipboard.writeText(formLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStoreNameChange = (value: string) => {
    setBusinessName(value);
  };

  const handleStoreNameSave = async () => {
    const trimmed = businessName.trim();
    if (!trimmed || trimmed === user?.businessName) return;

    setSavingStoreName(true);
    try {
      const { user: updated } = await updateSettings({ businessName: trimmed });
      setUser(updated);
      setBusinessName(updated.businessName);
    } catch (error) {
      console.error(error);
      setBusinessName(user?.businessName ?? "");
    } finally {
      setSavingStoreName(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen bg-white text-black font-body"
    >
      <div className="w-full max-w-[420px] mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <header className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold tracking-tight text-black mb-2">
                Dashboard Owner
              </p>
              <h1 className="text-[22px] font-semibold tracking-tight text-black leading-tight truncate">
                {user.username}
              </h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-0.5 text-[13px] font-bold text-black shrink-0 mt-1 active:opacity-60"
            >
              Keluar
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="store-name" className="text-[12px] font-bold text-black">
              Nama Toko
            </label>
            <input
              id="store-name"
              type="text"
              value={businessName}
              onChange={(e) => handleStoreNameChange(e.target.value)}
              onBlur={handleStoreNameSave}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              placeholder="Contoh: Laundry Express BSD"
              className="w-full py-2.5 px-3 border border-black/10 rounded-[10px] text-[14px] font-light text-black placeholder-black/30 outline-none focus:border-black transition-colors"
            />
            <p className="text-[11px] font-light text-black/40 leading-relaxed">
              {savingStoreName
                ? "Menyimpan..."
                : "Nama toko otomatis terisi di formulir pelanggan via link."}
            </p>
          </div>

          <ScoreTrendChart feedbacks={feedbacks} />
        </header>

        {/* Link Formulir */}
        <section className="space-y-3">
          <h2 className="text-[14px] font-bold text-black">
            Link Formulir Pelanggan
          </h2>

          <div className="py-2.5 px-3 border border-black/10 rounded-[10px]">
            <p className="text-[11px] font-light text-black/60 break-all leading-relaxed">
              {formLink}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 bg-black text-white text-[13px] font-light rounded-[10px] active:opacity-80 transition-opacity"
          >
            {copied ? "Tersalin" : "Salin Link"}
          </button>

          <CustomerFormPreview businessName={businessName} aspects={aspects} />
        </section>

        {/* Aspek Kritik */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[14px] font-bold text-black">
              Aspek yang Ingin Dinilai
            </h2>
            <p className="text-[12px] font-light text-black/40 mt-1">
              Sesuaikan poin penilaian pada formulir pelanggan.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newAspect}
              onChange={(e) => setNewAspect(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAspect()}
              placeholder="Layanan, Tatakrama, Kebersihan"
              className="flex-1 min-w-0 py-2.5 px-0 bg-transparent border-0 border-b border-black/10 text-[14px] font-light text-black placeholder-black/30 outline-none focus:border-black transition-colors"
            />
            <button
              type="button"
              onClick={handleAddAspect}
              className="shrink-0 px-4 py-2 bg-black text-white text-[12px] font-light rounded-full active:opacity-80 transition-opacity self-end mb-0.5"
            >
              Tambah
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {aspects.map((aspect) => (
              <span
                key={aspect}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-black text-[12px] font-light text-black"
              >
                {aspect}
                <button
                  type="button"
                  onClick={() => handleRemoveAspect(aspect)}
                  className="text-black/40 hover:text-black transition-colors"
                  aria-label={`Hapus ${aspect}`}
                >
                  <X size={11} strokeWidth={1.5} />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Rangkuman AI */}
        <section className="space-y-3">
          <h2 className="text-[14px] font-bold text-black">
            Rangkuman Umpan Balik (Generated by AI)
          </h2>
          <div className="border border-black/10 rounded-[12px] px-4 py-5">
            {loadingSummary ? (
              <p className="text-[13px] font-light text-black/40 animate-pulse">
                AI sedang membaca data...
              </p>
            ) : summaryBullets.length === 0 ? (
              <p className="text-[13px] font-light text-black/40 leading-relaxed">
                Belum ada umpan balik untuk dirangkum. Bagikan link formulir pelanggan untuk mulai mengumpulkan data.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {summaryBullets.map((bullet, index) => (
                  <li
                    key={index}
                    className="flex gap-2.5 text-[13px] font-light text-black/70 leading-relaxed"
                  >
                    <span className="text-black/30 shrink-0">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Database */}
        <section className="space-y-4 pb-8">
          <div>
            <h2 className="text-[14px] font-bold text-black">
              Database Kritik & Saran
            </h2>
            <p className="text-[12px] font-light text-black/40 mt-1">
              Semua umpan balik yang masuk dari pelanggan.
            </p>
          </div>

          {feedbacks.length === 0 ? (
            <div className="py-8 text-center border border-black/10 rounded-[12px]">
              <p className="text-[13px] font-light text-black/40">
                Belum ada feedback masuk.
              </p>
              <p className="text-[12px] font-light text-black/30 mt-1">
                Salin link formulir di atas dan bagikan ke pelanggan.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10 border-t border-black/10">
              {feedbacks.map((item) => (
                <div key={item.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-light text-black/50">
                      {formatDate(item.createdAt)}
                    </span>
                    <span className="text-[12px] font-semibold text-black tabular-nums">
                      {item.rating}/4
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-black">
                    {item.isAnonymous ? "Anonim" : item.consumerName || "—"}
                  </p>
                  <p className="text-[13px] font-light text-black/60 leading-relaxed">
                    {item.text || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-[11px] font-light text-black/35 pb-2">
          Created by arieadelwin
        </p>
      </div>
    </motion.div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
