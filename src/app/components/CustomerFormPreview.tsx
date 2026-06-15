interface CustomerFormPreviewProps {
  businessName: string;
  aspects: string[];
}

export function CustomerFormPreview({ businessName, aspects }: CustomerFormPreviewProps) {
  const previewAspects = aspects.slice(0, 3);

  return (
    <div className="border border-black/10 rounded-[12px] overflow-hidden bg-[#FAFAF8]">
      <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide px-3 pt-3 pb-2">
        Preview Tampilan Konsumen
      </p>

      <div className="mx-3 mb-3 rounded-[14px] overflow-hidden bg-white border border-black/5 scale-[0.98] origin-top">
        <div className="bg-black px-3 py-2.5 rounded-b-[12px]">
          <p className="text-white/45 text-[6px] leading-snug text-center mb-1.5">
            Umpan Balik Langsung Disampaikan Ke Pemilik
          </p>
          <div className="flex justify-between px-0.5">
            {["😠", "😕", "🙂", "🤩"].map((emoji, i) => (
              <span
                key={emoji}
                className={`text-[10px] ${i === 0 ? "opacity-100" : "opacity-35 grayscale"}`}
              >
                {emoji}
              </span>
            ))}
          </div>
          <div className="mt-1.5 h-0.5 rounded-full bg-white/20">
            <div className="h-full w-1/4 rounded-full bg-white/70" />
          </div>
        </div>

        <div className="px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2 border border-black/5 rounded-[8px] px-2.5 py-2">
            <span className="text-[8px] text-black/50 shrink-0">Nama Usaha *</span>
            <span className="text-[8px] font-semibold text-black truncate">
              {businessName || "Nama Usaha"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border border-black/5 rounded-[8px] px-2.5 py-2">
            <span className="text-[8px] text-black/50 shrink-0">No. Transaksi *</span>
            <span className="text-[8px] text-black/30">TRX-123</span>
          </div>

          <p className="text-[7px] font-bold text-black/35 uppercase tracking-wider px-0.5">
            Aspek Kritik
          </p>
          <div className="space-y-1">
            {previewAspects.map((aspect) => (
              <div
                key={aspect}
                className="flex items-center justify-between border border-black/5 rounded-[6px] px-2 py-1.5"
              >
                <span className="text-[7px] text-black/70 truncate">{aspect}</span>
                <span className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
