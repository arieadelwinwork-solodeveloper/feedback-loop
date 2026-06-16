import { useState, useCallback, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { registerUser } from "@/lib/api";
import { PasswordField } from "./PasswordField";
import { isTurnstileEnabled, TurnstileWidget } from "./TurnstileWidget";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

export function RegisterModal({ open, onClose }: RegisterModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setError("");
    setSuccess(false);
    setLoading(false);
    setCaptchaToken(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (isTurnstileEnabled() && !captchaToken) {
      setError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        username,
        email,
        password,
        captchaToken: captchaToken ?? undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Tutup modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center p-5 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="register-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="pointer-events-auto w-full max-w-[360px] bg-white rounded-[16px] shadow-[0_24px_80px_rgba(0,0,0,0.12)] px-6 py-7 relative font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]"
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 text-[#8E8E93] hover:text-[#1A1A1A] transition-colors rounded-full"
                aria-label="Tutup"
              >
                <X size={18} strokeWidth={1.5} />
              </button>

              {success ? (
                <div className="text-center pt-2 pb-1">
                  <h2 id="register-modal-title" className="text-[20px] font-light tracking-tight text-[#1A1A1A] mb-2">
                    Akun Berhasil Dibuat
                  </h2>
                  <p className="text-[14px] font-light text-[#8E8E93] leading-relaxed mb-6">
                    Selamat datang! Anda sekarang dapat mengakses fitur Feedback Loop.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full bg-[#1A1A1A] text-white font-medium py-[14px] rounded-full active:scale-[0.98] transition-transform text-[15px]"
                  >
                    Lanjutkan
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 pr-6">
                    <h2 id="register-modal-title" className="text-[20px] font-light tracking-tight text-[#1A1A1A]">
                      Daftar Akun
                    </h2>
                    <p className="text-[13px] font-light text-[#8E8E93] mt-1.5 leading-relaxed">
                      Buat akun owner untuk mulai customisasi kuesioner.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <RegisterField
                      label="ID / Username"
                      type="text"
                      placeholder="nama.panggilan"
                      value={username}
                      onChange={setUsername}
                      required
                      autoComplete="username"
                    />
                    <RegisterField
                      label="Gmail / Email"
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={setEmail}
                      required
                      autoComplete="email"
                    />
                    <PasswordField
                      label="Password"
                      placeholder="Min. 8 karakter, huruf & angka"
                      value={password}
                      onChange={setPassword}
                      required
                      autoComplete="new-password"
                      labelClassName="text-[#8E8E93]"
                      inputClassName="border-[#E5E5EA] placeholder-[#C0BEB8] focus:border-[#1A1A1A] text-[#1A1A1A]"
                    />

                    <TurnstileWidget onToken={handleCaptchaToken} onExpire={handleCaptchaExpire} />

                    {error && (
                      <p className="text-[13px] font-light text-red-500 text-center leading-snug">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || (isTurnstileEnabled() && !captchaToken)}
                      className="w-full bg-[#1A1A1A] text-white font-medium py-[14px] rounded-full active:scale-[0.98] transition-transform text-[15px] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {loading ? "Memproses..." : "Daftar Sekarang"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function RegisterField({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
  autoComplete,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-light tracking-wide text-[#8E8E93] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-[#E5E5EA] text-[15px] font-light text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors"
      />
    </div>
  );
}
