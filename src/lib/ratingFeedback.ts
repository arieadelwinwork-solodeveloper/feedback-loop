import confetti from "canvas-confetti";

const PITCH_BY_RATING: Record<number, number> = {
  1: 349.23,
  2: 440.0,
  3: 554.37,
  4: 783.99,
};

const CONFETTI_COLORS = [
  "#FFFFFF",
  "#FF2D55",
  "#007AFF",
  "#34C759",
  "#FFD60A",
  "#BF5AF2",
  "#FF6B00",
];

let sharedContext: AudioContext | null = null;
let celebrationConfetti: ReturnType<typeof confetti.create> | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  if (!sharedContext) {
    sharedContext = new AudioContext();
  }

  return sharedContext;
}

function getCelebrationConfetti() {
  if (typeof document === "undefined") return null;

  if (celebrationConfetti) return celebrationConfetti;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";
  document.body.appendChild(canvas);

  celebrationConfetti = confetti.create(canvas, {
    resize: true,
    useWorker: false,
  });

  return celebrationConfetti;
}

export async function playRatingTing(rating: number) {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    await context.resume();
  }

  const baseFrequency = PITCH_BY_RATING[rating] ?? PITCH_BY_RATING[2];
  const now = context.currentTime;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = rating === 4 ? "triangle" : rating === 1 ? "sawtooth" : "sine";
  oscillator.frequency.setValueAtTime(baseFrequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(
    rating === 4 ? 0.32 : rating === 1 ? 0.26 : 0.22,
    now + 0.012,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (rating === 4 ? 0.28 : rating === 1 ? 0.22 : 0.16));

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.3);

  if (rating === 4) {
    const sparkle = context.createOscillator();
    const sparkleGain = context.createGain();

    sparkle.type = "sine";
    sparkle.frequency.setValueAtTime(baseFrequency * 1.5, now + 0.04);

    sparkleGain.gain.setValueAtTime(0.0001, now + 0.04);
    sparkleGain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    sparkle.connect(sparkleGain);
    sparkleGain.connect(context.destination);

    sparkle.start(now + 0.04);
    sparkle.stop(now + 0.24);
  }
}

export function fireRatingCelebration() {
  const shoot = getCelebrationConfetti() ?? confetti;

  const burst = (origin: { x: number; y: number }, particleCount = 90) => {
    shoot({
      particleCount,
      spread: 110,
      startVelocity: 48,
      gravity: 0.9,
      ticks: 240,
      scalar: 1.15,
      origin,
      colors: CONFETTI_COLORS,
      disableForReducedMotion: false,
    });
  };

  burst({ x: 0.5, y: 0.12 }, 120);
  burst({ x: 0.15, y: 0.3 }, 70);
  burst({ x: 0.85, y: 0.3 }, 70);

  window.setTimeout(() => {
    burst({ x: 0.35, y: 0.2 }, 55);
    burst({ x: 0.65, y: 0.2 }, 55);
  }, 150);
}

const FIRE_COLORS = ["#FF4500", "#FF5722", "#FF9800", "#FFD54F", "#DC2626", "#FFEB3B"];

export function fireBadRatingEffect() {
  const shoot = getCelebrationConfetti() ?? confetti;

  const burst = (origin: { x: number; y: number }, particleCount = 50) => {
    shoot({
      particleCount,
      angle: 90,
      spread: 65,
      startVelocity: 42,
      gravity: 0.55,
      ticks: 160,
      scalar: 0.95,
      origin,
      colors: FIRE_COLORS,
      disableForReducedMotion: false,
    });
  };

  burst({ x: 0.125, y: 0.78 }, 65);
  burst({ x: 0.125, y: 0.68 }, 45);

  window.setTimeout(() => {
    burst({ x: 0.19, y: 0.74 }, 35);
    burst({ x: 0.08, y: 0.74 }, 35);
  }, 120);
}
