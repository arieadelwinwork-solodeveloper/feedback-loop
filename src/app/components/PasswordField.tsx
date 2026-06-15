import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export function PasswordField({
  label,
  placeholder = "••••••••",
  value,
  onChange,
  required,
  autoComplete,
  labelClassName = "text-[#666]",
  inputClassName = "border-black/10 placeholder-black/30 focus:border-black text-black",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className={`block text-[12px] font-light tracking-wide mb-1.5 ${labelClassName}`}>
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className={`w-full pr-10 py-2.5 bg-transparent border-0 border-b text-[15px] font-light outline-none transition-colors ${inputClassName}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0 p-1.5 text-black/40 hover:text-black/70 transition-colors"
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        >
          {visible ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  );
}
