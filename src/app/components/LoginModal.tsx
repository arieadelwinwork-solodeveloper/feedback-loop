import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { PasswordField } from "./PasswordField";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      resetForm();
      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Coba lagi.");
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
              aria-labelledby="login-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="pointer-events-auto w-full max-w-[360px] bg-white rounded-[16px] px-6 py-7 relative font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]"
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 text-[#8E8E93] hover:text-black transition-colors rounded-full"
                aria-label="Tutup"
              >
                <X size={18} strokeWidth={1.5} />
              </button>

              <div className="mb-6 pr-6">
                <h2 id="login-modal-title" className="text-[20px] font-light tracking-tight text-black">
                  Akses Akun
                </h2>
                <p className="text-[13px] font-light text-[#666] mt-1.5 leading-relaxed">
                  Masuk untuk mengelola kuesioner dan data umpan balik.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <LoginField
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
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  required
                  autoComplete="current-password"
                />

                {error && (
                  <p className="text-[13px] font-light text-red-600 text-center leading-snug">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white font-light py-[14px] rounded-full active:scale-[0.98] transition-transform text-[15px] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? "Memproses..." : "Masuk"}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function LoginField({
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
      <label className="block text-[12px] font-light tracking-wide text-[#666] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-black/10 text-[15px] font-light text-black placeholder-black/30 outline-none focus:border-black transition-colors"
      />
    </div>
  );
}
