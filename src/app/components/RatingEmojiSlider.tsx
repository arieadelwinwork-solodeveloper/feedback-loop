import { useState } from "react";
import { motion } from "motion/react";
import { fireRatingCelebration, playRatingTing } from "@/lib/ratingFeedback";

export interface RatingTheme {
  background: string;
  pageBackground: string;
  subtitleClass: string;
  labelActiveClass: string;
  labelIdleClass: string;
  trackFill: string;
  trackBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  heading: string;
  surface: string;
  surfaceBorder: string;
  divider: string;
  inputText: string;
  inputPlaceholder: string;
  buttonPrimary: string;
  buttonOutline: string;
  buttonOutlineText: string;
  checkActive: string;
  checkIdle: string;
  borderSection: string;
}

export const RATING_CARD_THEMES: Record<number, RatingTheme> = {
  1: {
    background: "linear-gradient(165deg, #7F1D1D 0%, #DC2626 55%, #991B1B 100%)",
    pageBackground: "linear-gradient(180deg, #450A0A 0%, #7F1D1D 100%)",
    subtitleClass: "text-white/80",
    labelActiveClass: "text-white font-semibold",
    labelIdleClass: "text-white/50 font-light",
    trackFill: "bg-white/85",
    trackBg: "bg-black/20",
    textPrimary: "text-white",
    textSecondary: "text-white/85",
    textMuted: "text-white/55",
    heading: "text-white/70",
    surface: "bg-white/12 backdrop-blur-sm",
    surfaceBorder: "border-white/20",
    divider: "bg-white/15",
    inputText: "text-white",
    inputPlaceholder: "placeholder:text-white/40",
    buttonPrimary: "bg-white text-red-800 hover:bg-white/90",
    buttonOutline: "border-white/80",
    buttonOutlineText: "text-white",
    checkActive: "bg-white border-white",
    checkIdle: "border-white/45",
    borderSection: "border-white/15",
  },
  2: {
    background: "linear-gradient(165deg, #A16207 0%, #EAB308 55%, #CA8A04 100%)",
    pageBackground: "linear-gradient(180deg, #713F12 0%, #A16207 100%)",
    subtitleClass: "text-black/65",
    labelActiveClass: "text-black font-semibold",
    labelIdleClass: "text-black/45 font-light",
    trackFill: "bg-black/30",
    trackBg: "bg-black/12",
    textPrimary: "text-black",
    textSecondary: "text-black/80",
    textMuted: "text-black/55",
    heading: "text-black/60",
    surface: "bg-black/8 backdrop-blur-sm",
    surfaceBorder: "border-black/15",
    divider: "bg-black/12",
    inputText: "text-black",
    inputPlaceholder: "placeholder:text-black/35",
    buttonPrimary: "bg-black text-yellow-300 hover:bg-black/90",
    buttonOutline: "border-black/70",
    buttonOutlineText: "text-black",
    checkActive: "bg-black border-black",
    checkIdle: "border-black/35",
    borderSection: "border-black/12",
  },
  3: {
    background: "linear-gradient(165deg, #14532D 0%, #22C55E 55%, #166534 100%)",
    pageBackground: "linear-gradient(180deg, #052E16 0%, #14532D 100%)",
    subtitleClass: "text-white/80",
    labelActiveClass: "text-white font-semibold",
    labelIdleClass: "text-white/50 font-light",
    trackFill: "bg-white/85",
    trackBg: "bg-black/20",
    textPrimary: "text-white",
    textSecondary: "text-white/85",
    textMuted: "text-white/55",
    heading: "text-white/70",
    surface: "bg-white/12 backdrop-blur-sm",
    surfaceBorder: "border-white/20",
    divider: "bg-white/15",
    inputText: "text-white",
    inputPlaceholder: "placeholder:text-white/40",
    buttonPrimary: "bg-white text-green-800 hover:bg-white/90",
    buttonOutline: "border-white/80",
    buttonOutlineText: "text-white",
    checkActive: "bg-white border-white",
    checkIdle: "border-white/45",
    borderSection: "border-white/15",
  },
  4: {
    background: "linear-gradient(135deg, #78350F 0%, #B45309 32%, #EAB308 68%, #FDE68A 100%)",
    pageBackground: "linear-gradient(180deg, #451A03 0%, #78350F 100%)",
    subtitleClass: "text-white/90 drop-shadow-sm",
    labelActiveClass: "text-white font-semibold drop-shadow-sm",
    labelIdleClass: "text-white/55 font-light",
    trackFill: "bg-white/90",
    trackBg: "bg-black/20",
    textPrimary: "text-white",
    textSecondary: "text-white/90",
    textMuted: "text-white/60",
    heading: "text-white/75",
    surface: "bg-white/15 backdrop-blur-sm",
    surfaceBorder: "border-white/25",
    divider: "bg-white/18",
    inputText: "text-white",
    inputPlaceholder: "placeholder:text-white/45",
    buttonPrimary: "bg-white text-amber-900 hover:bg-white/90",
    buttonOutline: "border-white/85",
    buttonOutlineText: "text-white",
    checkActive: "bg-white border-white",
    checkIdle: "border-white/50",
    borderSection: "border-white/18",
  },
};

export function getRatingTheme(value: number): RatingTheme {
  return RATING_CARD_THEMES[value] ?? RATING_CARD_THEMES[1];
}

const RATING_OPTIONS = [
  { value: 1, emoji: "😠", label: "Buruk" },
  { value: 2, emoji: "😕", label: "Cukup" },
  { value: 3, emoji: "🙂", label: "Baik" },
  { value: 4, emoji: "🤩", label: "Luar biasa" },
] as const;

interface RatingEmojiSliderProps {
  value: number;
  onChange: (value: number) => void;
  theme: RatingTheme;
}

export function RatingEmojiSlider({ value, onChange, theme }: RatingEmojiSliderProps) {
  const [popState, setPopState] = useState<{ tick: number; value: number } | null>(null);
  const activeValue = value;
  const sliderPercent = ((activeValue - 1) / (RATING_OPTIONS.length - 1)) * 100;

  const handleValueChange = (nextValue: number) => {
    if (nextValue === value) return;

    void playRatingTing(nextValue);
    setPopState({ tick: Date.now(), value: nextValue });

    if (nextValue === 4) {
      fireRatingCelebration();
    }

    onChange(nextValue);
  };

  return (
    <div className="w-full overflow-visible">
      <div className="grid grid-cols-4 gap-0.5 sm:gap-1 mb-4 overflow-visible px-0.5">
        {RATING_OPTIONS.map((option) => {
          const isActive = activeValue === option.value;
          const isLuarBiasa = option.value === 4;
          const isBuruk = option.value === 1;
          const shouldPop = popState?.value === option.value;
          const popKey = shouldPop ? popState.tick : "idle";

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleValueChange(option.value)}
              className="flex flex-col items-center gap-1.5 min-w-0 px-0.5 overflow-visible"
            >
              <span className="relative inline-flex items-center justify-center overflow-visible p-1">
                {shouldPop && isBuruk && (
                  <>
                    <motion.span
                      key={`burn-${popKey}`}
                      className="absolute inset-0 rounded-full bg-orange-500/55"
                      initial={{ scale: 0.55, opacity: 0.9 }}
                      animate={{ scale: 2.4, opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      aria-hidden
                    />
                    {[0, 1, 2, 3].map((index) => (
                      <motion.span
                        key={`flame-${popKey}-${index}`}
                        className="absolute text-[13px] sm:text-[15px] pointer-events-none select-none"
                        initial={{
                          opacity: 0.95,
                          y: 2,
                          x: (index - 1.5) * 9,
                          scale: 0.75,
                        }}
                        animate={{
                          opacity: 0,
                          y: -32 - index * 5,
                          x: (index - 1.5) * 14,
                          scale: 1.15,
                        }}
                        transition={{ duration: 0.75, delay: index * 0.06, ease: "easeOut" }}
                        aria-hidden
                      >
                        🔥
                      </motion.span>
                    ))}
                  </>
                )}
                {shouldPop && isLuarBiasa && (
                  <motion.span
                    key={`glow-${popKey}`}
                    className="absolute inset-0 rounded-full bg-white/35"
                    initial={{ scale: 0.6, opacity: 0.85 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    aria-hidden
                  />
                )}
                <motion.span
                  key={`emoji-${option.value}-${popKey}`}
                  className={`relative inline-flex items-center justify-center text-[26px] sm:text-[30px] leading-none ${
                    isActive ? "opacity-100" : "opacity-35 grayscale"
                  }`}
                  initial={false}
                  animate={
                    shouldPop
                      ? {
                          scale: isBuruk
                            ? [1, 1.45, 0.9, 1.18, isActive ? 1.12 : 1]
                            : [1, 1.55, 0.92, 1.15, isActive ? 1.12 : 1],
                          rotate: isLuarBiasa
                            ? [0, -8, 8, 0]
                            : isBuruk
                              ? [0, -14, 14, -10, 10, 0]
                              : 0,
                        }
                      : { scale: isActive ? 1.12 : 1, rotate: 0 }
                  }
                  transition={{
                    duration: isLuarBiasa ? 0.55 : isBuruk ? 0.5 : 0.42,
                    ease: isBuruk ? [0.36, 0.07, 0.19, 0.97] : [0.34, 1.56, 0.64, 1],
                  }}
                >
                  {option.emoji}
                </motion.span>
              </span>
              <span
                className={`text-[9px] sm:text-[10px] leading-tight text-center max-w-full truncate px-0.5 ${
                  isActive ? theme.labelActiveClass : theme.labelIdleClass
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative px-1">
        <div className={`h-1.5 rounded-full overflow-hidden transition-colors duration-300 ${theme.trackBg}`}>
          <div
            className={`h-full rounded-full transition-all duration-200 ${theme.trackFill}`}
            style={{ width: `${sliderPercent}%` }}
          />
        </div>
        <input
          type="range"
          min={1}
          max={4}
          step={1}
          value={activeValue}
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Skor penilaian"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-white/90 shadow-sm pointer-events-none transition-all duration-200"
          style={{ left: `clamp(0px, calc(${sliderPercent}% - 8px), calc(100% - 16px))` }}
        />
      </div>
    </div>
  );
}
