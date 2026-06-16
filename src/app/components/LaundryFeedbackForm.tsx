import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { fetchFormConfig, submitFeedback } from "@/lib/api";
import { hasSubmittedFeedback, markFeedbackSubmitted } from "@/lib/feedbackSubmission";
import { LoginModal } from "./LoginModal";
import { RegisterModal } from "./RegisterModal";
import { RatingEmojiSlider, getRatingTheme, type RatingTheme } from "./RatingEmojiSlider";
import { isTurnstileEnabled, TurnstileWidget } from "./TurnstileWidget";

const DEFAULT_ASPECTS = [
  "Kualitas layanan",
  "Ketepatan waktu",
  "Keramahan staf",
  "Kebersihan toko",
  "Transparansi harga",
  "Lainnya",
];

export function LaundryFeedbackForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [aspectOptions, setAspectOptions] = useState(DEFAULT_ASPECTS);
  const [score, setScore] = useState<number>(1);
  const [submitted, setSubmitted] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const usahaFromLink = searchParams.get("usaha")?.trim() ?? "";
  const isBusinessNameLocked = Boolean(usahaFromLink);

  const [formData, setFormData] = useState({
    namaUsaha: "",
    nomorTransaksi: "",
    namaKonsumen: "",
    nomorWA: "",
    kronologi: "",
    saran: "",
    kualitas: "",
  });

  useEffect(() => {
    const businessName = formData.namaUsaha.trim();
    if (businessName && hasSubmittedFeedback(businessName)) {
      setSubmitted(true);
    }
  }, [formData.namaUsaha]);

  useEffect(() => {
    if (!usahaFromLink) return;

    if (hasSubmittedFeedback(usahaFromLink)) {
      setSubmitted(true);
    }

    setFormData((prev) => ({ ...prev, namaUsaha: usahaFromLink }));
    fetchFormConfig(usahaFromLink)
      .then(({ aspects, businessName }) => {
        const resolvedName = businessName || usahaFromLink;
        if (hasSubmittedFeedback(resolvedName)) {
          setSubmitted(true);
        }
        if (businessName) {
          setFormData((prev) => ({ ...prev, namaUsaha: businessName }));
        }
        if (aspects.length > 0) setAspectOptions([...aspects, "Lainnya"]);
      })
      .catch(console.error);
  }, [usahaFromLink]);

  const toggleAspect = (aspect: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect) ? prev.filter((a) => a !== aspect) : [...prev, aspect],
    );
  };

  const handleSubmit = async () => {
    if (!formData.namaUsaha.trim()) return;

    if (isTurnstileEnabled() && !captchaToken) {
      setSubmitError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setSubmitError("");
    setSubmitting(true);
    try {
      const text = [formData.kronologi, formData.saran, formData.kualitas]
        .filter(Boolean)
        .join(" · ");

      const businessName = formData.namaUsaha.trim();

      await submitFeedback({
        businessName,
        consumerName: formData.namaKonsumen,
        isAnonymous,
        rating: score,
        text,
        aspects: selectedAspects,
        captchaToken: captchaToken ?? undefined,
      });
      markFeedbackSubmitted(businessName);
      setSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengirim feedback.";
      setSubmitError(message);
      if (message.includes("hanya bisa diisi sekali")) {
        markFeedbackSubmitted(formData.namaUsaha.trim());
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const theme = getRatingTheme(score);
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center transition-all duration-500"
        style={{ background: theme.background }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
          <CheckCircle2 className={`w-16 h-16 mb-4 mx-auto ${theme.textPrimary}`} strokeWidth={1.5} />
        </motion.div>
        <h2 className={`text-xl font-semibold mb-2 ${theme.textPrimary}`}>Terima Kasih!</h2>
        <p className={`text-[15px] mb-4 ${theme.textSecondary}`}>
          Masukan Anda sangat berarti bagi peningkatan kualitas layanan kami.
        </p>
        <p className={`text-[13px] ${theme.textMuted}`}>
          Formulir untuk usaha ini hanya dapat diisi sekali dari perangkat ini. Anda masih bisa mengisi form usaha lain.
        </p>
      </div>
    );
  }

  const theme = getRatingTheme(score);
  const displayBusinessName = formData.namaUsaha.trim() || "Usaha Anda";

  return (
    <div
      className="min-h-screen py-6 px-3 sm:py-8 sm:px-4 flex justify-center overflow-x-hidden font-body transition-[background] duration-500 ease-out"
      style={{ background: theme.pageBackground }}
    >
      <div
        className="w-full max-w-[420px] min-w-0 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden transition-[background] duration-500 ease-out"
        style={{ background: theme.background }}
      >
        <div className="p-5 sm:p-6 pb-6 sm:pb-7 relative z-10 overflow-visible">
          <div className={`text-center mb-5 transition-colors duration-500 font-poppins ${theme.subtitleClass}`}>
            <p className="text-[18px] sm:text-[20px] font-semibold leading-snug tracking-wide">
              Form Kritik &amp; Saran Untuk
            </p>
            <p className="text-[24px] sm:text-[28px] font-bold leading-tight mt-1.5 tracking-tight">
              &ldquo;{displayBusinessName}&rdquo;
            </p>
          </div>
          <RatingEmojiSlider value={score} onChange={setScore} theme={theme} />
        </div>

        <div className="px-4 sm:px-5 py-6 space-y-7 min-w-0">
          
          <div>
            <div className={`rounded-xl border overflow-hidden ${theme.surface} ${theme.surfaceBorder}`}>
              <FieldRow label="Nama Usaha *" theme={theme}>
                <input
                  type="text"
                  placeholder="Cabang Laundry"
                  readOnly={isBusinessNameLocked}
                  aria-readonly={isBusinessNameLocked}
                  title={isBusinessNameLocked ? "Nama usaha ditentukan oleh link formulir" : undefined}
                  className={`w-full min-w-0 text-left bg-transparent outline-none text-[15px] ${theme.inputText} ${theme.inputPlaceholder} ${isBusinessNameLocked ? "cursor-not-allowed opacity-80" : ""}`}
                  value={formData.namaUsaha}
                  onChange={(e) => {
                    if (isBusinessNameLocked) return;
                    setFormData({ ...formData, namaUsaha: e.target.value });
                  }}
                />
              </FieldRow>
              <div className={`h-[1px] ml-4 ${theme.divider}`} />
              <FieldRow label="No. Transaksi *" theme={theme}>
                <input
                  type="text"
                  placeholder="TRX-123"
                  className={`w-full min-w-0 text-left bg-transparent outline-none text-[15px] ${theme.inputText} ${theme.inputPlaceholder}`}
                  value={formData.nomorTransaksi}
                  onChange={e => setFormData({...formData, nomorTransaksi: e.target.value})}
                />
              </FieldRow>
            </div>
          </div>

          <div>
            <div className={`rounded-xl border overflow-hidden ${theme.surface} ${theme.surfaceBorder}`}>
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 min-w-0">
                <span className={`font-medium text-[14px] sm:text-[15px] min-w-0 flex-1 ${theme.textPrimary}`}>Kirim secara anonim</span>
                <Toggle checked={isAnonymous} onChange={setIsAnonymous} theme={theme} />
              </div>
              
              <AnimatePresence>
                {!isAnonymous && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className={`h-[1px] ml-4 ${theme.divider}`} />
                    <FieldRow label="Nama Konsumen" theme={theme}>
                      <input
                        type="text"
                        placeholder="Nama Anda"
                        className={`w-full min-w-0 text-left bg-transparent outline-none text-[15px] ${theme.inputText} ${theme.inputPlaceholder}`}
                        value={formData.namaKonsumen}
                        onChange={e => setFormData({...formData, namaKonsumen: e.target.value})}
                      />
                    </FieldRow>
                    <div className={`h-[1px] ml-4 ${theme.divider}`} />
                    <FieldRow label="Nomor WhatsApp" theme={theme}>
                      <input
                        type="tel"
                        placeholder="0812-XXXX-XXXX"
                        className={`w-full min-w-0 text-left bg-transparent outline-none text-[15px] ${theme.inputText} ${theme.inputPlaceholder}`}
                        value={formData.nomorWA}
                        onChange={e => setFormData({...formData, nomorWA: e.target.value})}
                      />
                    </FieldRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <h3 className={`text-[13px] font-medium uppercase tracking-wider mb-2 ml-2 ${theme.heading}`}>Aspek Kritik</h3>
            <div className={`rounded-xl border overflow-hidden ${theme.surface} ${theme.surfaceBorder}`}>
              {aspectOptions.map((aspect, index) => (
                <div key={aspect}>
                  <label
                    onClick={() => toggleAspect(aspect)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer active:opacity-80 transition-opacity min-w-0"
                  >
                    <span className={`font-medium text-[14px] sm:text-[15px] min-w-0 flex-1 ${theme.textPrimary}`}>{aspect}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border ${selectedAspects.includes(aspect) ? `${theme.checkActive}` : theme.checkIdle}`}>
                      {selectedAspects.includes(aspect) && (
                        <Check
                          size={12}
                          className={theme.buttonPrimary.includes("text-yellow") ? "text-yellow-300" : "text-black"}
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </label>
                  {index < aspectOptions.length - 1 && <div className={`h-[1px] ml-4 ${theme.divider}`} />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`text-[13px] font-medium uppercase tracking-wider mb-2 ml-2 ${theme.heading}`}>Detail (Opsional)</h3>
            <div className={`rounded-xl border overflow-hidden flex flex-col ${theme.surface} ${theme.surfaceBorder}`}>
              <TextAreaField 
                placeholder="Kronologi kejadian..." 
                value={formData.kronologi}
                onChange={v => setFormData({...formData, kronologi: v})}
                theme={theme}
              />
              <div className={`h-[1px] ${theme.divider}`} />
              <TextAreaField 
                placeholder="Saran membangun..." 
                value={formData.saran}
                onChange={v => setFormData({...formData, saran: v})}
                theme={theme}
              />
              <div className={`h-[1px] ${theme.divider}`} />
              <TextAreaField 
                placeholder="Kualitas yang mesti dipertahankan..." 
                value={formData.kualitas}
                onChange={v => setFormData({...formData, kualitas: v})}
                theme={theme}
              />
            </div>
          </div>

          <div className="pt-4 pb-2">
            <TurnstileWidget onToken={handleCaptchaToken} onExpire={handleCaptchaExpire} />
            <button
              onClick={handleSubmit}
              disabled={submitting || (isTurnstileEnabled() && !captchaToken)}
              className={`w-full font-semibold py-[16px] rounded-full active:scale-[0.98] transition-all duration-300 text-[16px] disabled:opacity-50 ${theme.buttonPrimary}`}
            >
              {submitting ? "Mengirim..." : "Kirim Feedback"}
            </button>
            {submitError && (
              <p className="text-center text-[13px] mt-3 font-light text-red-600 leading-snug">
                {submitError}
              </p>
            )}
            <p className={`text-center text-[13px] mt-4 font-medium ${theme.textMuted}`}>
              Data kamu aman · Satu kali isi per perangkat
            </p>
          </div>

          <div className={`pt-2 pb-4 border-t ${theme.borderSection}`}>
            <p className={`text-center text-[26px] font-bold tracking-[-0.03em] mt-3 mb-0.5 ${theme.textPrimary}`}>
              Feedback Loop
            </p>
            <p className={`text-center text-[10px] font-medium uppercase tracking-[0.22em] mb-5 ${theme.textMuted}`}>
              Platform Umpan Balik
            </p>
            <p className={`text-center text-[14px] leading-snug font-medium mb-4 px-1 ${theme.textSecondary}`}>
              Customisasi Kuesioner, Akses Data & Rangkuman Umpan Balik Melalui AI
            </p>
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className={`w-full border-2 font-semibold py-[14px] rounded-full active:scale-[0.98] transition-all duration-300 text-[16px] ${theme.buttonOutline} ${theme.buttonOutlineText}`}
            >
              Login
            </button>
            <p className={`text-center text-[14px] mt-4 ${theme.textMuted}`}>
              Belum memiliki akun ?{" "}
              <button
                type="button"
                onClick={() => setRegisterOpen(true)}
                className={`font-semibold underline underline-offset-2 active:opacity-70 ${theme.textPrimary}`}
              >
                Daftar Sekarang
              </button>
            </p>
            <p className={`text-center text-[11px] font-light mt-5 pb-1 ${theme.textMuted}`}>
              Created by arieadelwin
            </p>
          </div>

          <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
          <LoginModal
            open={loginOpen}
            onClose={() => setLoginOpen(false)}
            onSuccess={() => navigate("/dashboard")}
          />

        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children, theme }: { label: string; children: React.ReactNode; theme: RatingTheme }) {
  return (
    <div className="px-4 py-3.5 min-h-[52px] min-w-0">
      <span className={`block font-medium text-[13px] sm:text-[15px] mb-1.5 ${theme.textPrimary}`}>
        {label}
      </span>
      <div className="min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}

function TextAreaField({ placeholder, value, onChange, theme }: { placeholder: string; value: string; onChange: (v: string) => void; theme: RatingTheme }) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={3}
      className={`w-full p-4 text-[15px] bg-transparent outline-none resize-none leading-relaxed ${theme.inputText} ${theme.inputPlaceholder}`}
    />
  );
}

function Toggle({ checked, onChange, theme }: { checked: boolean; onChange: (v: boolean) => void; theme: RatingTheme }) {
  const isDarkAccent = theme.buttonPrimary.includes("text-yellow");

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? (isDarkAccent ? "bg-black" : "bg-white") : theme.trackBg
      }`}
    >
      <span className="sr-only">Toggle anonymous</span>
      <span
        className={`pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked
            ? "translate-x-[20px] bg-white"
            : `translate-x-0 ${isDarkAccent ? "bg-black/30" : "bg-white/70"}`
        }`}
      />
    </button>
  );
}
