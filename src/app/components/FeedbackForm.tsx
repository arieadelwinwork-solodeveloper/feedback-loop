import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle } from "lucide-react";

const CRITIQUE_CHIPS = ["Layanan", "Tatakrama", "Kerapian", "Ketepatan Waktu", "Harga", "Komunikasi"];

export function FeedbackForm() {
  const [namaUsaha, setNamaUsaha] = useState("");
  const [nomorTransaksi, setNomorTransaksi] = useState("");
  const [namaKonsumen, setNamaKonsumen] = useState("");
  const [nomorWA, setNomorWA] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [kronologi, setKronologi] = useState("");
  const [saran, setSaran] = useState("");
  const [kualitas, setKualitas] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ namaUsaha?: string; nomorTransaksi?: string }>({});

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!namaUsaha.trim()) newErrors.namaUsaha = "Nama usaha wajib diisi";
    if (!nomorTransaksi.trim()) newErrors.nomorTransaksi = "Nomor transaksi wajib diisi";
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
  };

  const handleReset = () => {
    setNamaUsaha(""); setNomorTransaksi(""); setNamaKonsumen("");
    setNomorWA(""); setSelectedChips([]); setKronologi("");
    setSaran(""); setKualitas(""); setRating(null);
    setSubmitted(false); setErrors({});
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-center flex flex-col items-center gap-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <CheckCircle size={64} color="#1C1C1E" strokeWidth={1.5} />
          </motion.div>
          <div>
            <h2 style={{ color: "#1C1C1E", fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>
              Terima Kasih!
            </h2>
            <p style={{ color: "#8E8E93", fontSize: "15px", fontWeight: 400, lineHeight: 1.6 }}>
              Masukan Anda telah berhasil dikirim.<br />Kami akan segera menindaklanjutinya.
            </p>
          </div>
          <button
            onClick={handleReset}
            style={{
              marginTop: "8px",
              padding: "14px 40px",
              borderRadius: "100px",
              border: "1.5px solid #1C1C1E",
              backgroundColor: "transparent",
              color: "#1C1C1E",
              fontSize: "15px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Kirim Masukan Lagi
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Status bar spacer */}
      <div style={{ height: "48px", backgroundColor: "#FFFFFF" }} />

      <div className="px-6 pb-10">

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <p style={{ color: "#8E8E93", fontSize: "12px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Formulir Masukan
          </p>
          <h1 style={{ color: "#1C1C1E", fontSize: "28px", fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.5px" }}>
            Beri Kami<br />Masukan
          </h1>
          <div style={{ marginTop: "12px", width: "32px", height: "3px", borderRadius: "2px", backgroundColor: "#1C1C1E" }} />
        </div>

        {/* Required Section */}
        <SectionLabel title="Informasi Wajib" required />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          <InputField
            label="Nama Usaha"
            placeholder="Contoh: Warung Pak Budi"
            value={namaUsaha}
            onChange={(v) => { setNamaUsaha(v); if (errors.namaUsaha) setErrors((e) => ({ ...e, namaUsaha: undefined })); }}
            error={errors.namaUsaha}
            required
          />
          <InputField
            label="Nomor Transaksi"
            placeholder="Contoh: TRX-20240614-001"
            value={nomorTransaksi}
            onChange={(v) => { setNomorTransaksi(v); if (errors.nomorTransaksi) setErrors((e) => ({ ...e, nomorTransaksi: undefined })); }}
            error={errors.nomorTransaksi}
            required
          />
        </div>

        {/* Divider */}
        <Divider />

        {/* Anonymous Section */}
        <SectionLabel title="Bisa Anonim" subtitle="Isi jika ingin kami menghubungi Anda" />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          <InputField
            label="Nama Konsumen"
            placeholder="Nama Anda (opsional)"
            value={namaKonsumen}
            onChange={setNamaKonsumen}
          />
          <InputField
            label="Nomor WhatsApp"
            placeholder="+62 8xx-xxxx-xxxx"
            value={nomorWA}
            onChange={setNomorWA}
            type="tel"
          />
        </div>

        {/* Divider */}
        <Divider />

        {/* Critique Chips */}
        <SectionLabel title="Sisi yang Ingin Dikritik" subtitle="Pilih satu atau lebih" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
          {CRITIQUE_CHIPS.map((chip) => (
            <ChipButton
              key={chip}
              label={chip}
              selected={selectedChips.includes(chip)}
              onToggle={() => toggleChip(chip)}
            />
          ))}
        </div>

        {/* Divider */}
        <Divider />

        {/* Optional Text Areas */}
        <SectionLabel title="Ceritakan Lebih Lanjut" subtitle="Semua kolom opsional" />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          <TextAreaField
            label="Kronologi Kejadian"
            placeholder="Ceritakan apa yang terjadi..."
            value={kronologi}
            onChange={setKronologi}
          />
          <TextAreaField
            label="Saran Membangun"
            placeholder="Apa yang bisa kami perbaiki?"
            value={saran}
            onChange={setSaran}
          />
          <TextAreaField
            label="Kualitas yang Mesti Dipertahankan"
            placeholder="Apa yang sudah baik dari kami?"
            value={kualitas}
            onChange={setKualitas}
          />
        </div>

        {/* Divider */}
        <Divider />

        {/* Rating Section */}
        <SectionLabel title="Skor Layanan / Produk" subtitle="Pilih angka 1 (buruk) hingga 4 (sangat baik)" />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "40px" }}>
          {[1, 2, 3, 4].map((score) => (
            <RatingCircle
              key={score}
              score={score}
              selected={rating === score}
              onSelect={() => setRating(score === rating ? null : score)}
            />
          ))}
        </div>

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: "100px",
            border: "none",
            backgroundColor: "#001F5B",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "0.01em",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0, 31, 91, 0.28)",
          }}
        >
          Kirim Feedback
        </motion.button>

        <p style={{ textAlign: "center", marginTop: "14px", color: "#C7C7CC", fontSize: "12px" }}>
          Data Anda aman dan terjaga kerahasiaannya
        </p>
      </div>
    </div>
  );
}

function SectionLabel({ title, subtitle, required }: { title: string; subtitle?: string; required?: boolean }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ color: "#1C1C1E", fontSize: "16px", fontWeight: 600 }}>{title}</span>
        {required && <span style={{ color: "#1C1C1E", fontSize: "14px", fontWeight: 700 }}>*</span>}
      </div>
      {subtitle && (
        <p style={{ color: "#8E8E93", fontSize: "13px", fontWeight: 400, marginTop: "2px" }}>{subtitle}</p>
      )}
    </div>
  );
}

function InputField({
  label, placeholder, value, onChange, error, required, type = "text",
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; error?: string; required?: boolean; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div
        style={{
          backgroundColor: "#FAFAFA",
          border: `1.5px solid ${error ? "#FF3B30" : focused ? "#1C1C1E" : "#E5E5EA"}`,
          borderRadius: "14px",
          padding: "0 16px",
          transition: "border-color 0.2s ease",
          position: "relative",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "11px",
            fontWeight: 500,
            color: error ? "#FF3B30" : focused ? "#1C1C1E" : "#8E8E93",
            paddingTop: "10px",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            transition: "color 0.2s ease",
          }}
        >
          {label}{required && " *"}
        </label>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            display: "block",
            width: "100%",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: "#1C1C1E",
            fontSize: "15px",
            fontWeight: 400,
            paddingBottom: "10px",
            paddingTop: "2px",
            fontFamily: "inherit",
          }}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{ color: "#FF3B30", fontSize: "12px", marginTop: "5px", paddingLeft: "4px" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function TextAreaField({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        backgroundColor: "#FAFAFA",
        border: `1.5px solid ${focused ? "#1C1C1E" : "#E5E5EA"}`,
        borderRadius: "14px",
        padding: "10px 16px",
        transition: "border-color 0.2s ease",
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 500,
          color: focused ? "#1C1C1E" : "#8E8E93",
          marginBottom: "4px",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          transition: "color 0.2s ease",
        }}
      >
        {label} <span style={{ color: "#C7C7CC", textTransform: "none", fontSize: "11px" }}>— Opsional</span>
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={3}
        style={{
          display: "block",
          width: "100%",
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          color: "#1C1C1E",
          fontSize: "15px",
          fontWeight: 400,
          resize: "none",
          fontFamily: "inherit",
          lineHeight: 1.55,
        }}
      />
    </div>
  );
}

function ChipButton({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      style={{
        padding: "8px 16px",
        borderRadius: "100px",
        border: `1.5px solid ${selected ? "#1C1C1E" : "#E5E5EA"}`,
        backgroundColor: selected ? "#1C1C1E" : "#FAFAFA",
        color: selected ? "#FFFFFF" : "#3A3A3C",
        fontSize: "14px",
        fontWeight: selected ? 500 : 400,
        cursor: "pointer",
        transition: "all 0.18s ease",
        fontFamily: "inherit",
      }}
    >
      {label}
    </motion.button>
  );
}

function RatingCircle({ score, selected, onSelect }: { score: number; selected: boolean; onSelect: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onSelect}
      style={{
        flex: 1,
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        border: `2px solid ${selected ? "#1C1C1E" : "#E5E5EA"}`,
        backgroundColor: selected ? "#1C1C1E" : "#FAFAFA",
        color: selected ? "#FFFFFF" : "#3A3A3C",
        fontSize: "20px",
        fontWeight: selected ? 700 : 400,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        boxShadow: selected ? "0 4px 16px rgba(28, 28, 30, 0.25)" : "none",
        fontFamily: "inherit",
        minWidth: 0,
      }}
    >
      {score}
    </motion.button>
  );
}

function Divider() {
  return <div style={{ height: "1px", backgroundColor: "#F2F2F7", margin: "0 0 28px 0" }} />;
}
