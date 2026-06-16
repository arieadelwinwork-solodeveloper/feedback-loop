import confetti from "canvas-confetti";

const PITCH_BY_RATING: Record<number, number> = {
  1: 349.23,
  2: 440.0,
  3: 554.37,
  4: 783.99,
};

let sharedContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  if (!sharedContext) {
    sharedContext = new AudioContext();
  }

  return sharedContext;
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

  oscillator.type = rating === 4 ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(baseFrequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(rating === 4 ? 0.32 : 0.22, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (rating === 4 ? 0.28 : 0.16));

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
  if (typeof window === "undefined") return;

  const origin = { x: 0.5, y: 0.22 };

  confettiBurst({ ...origin, particleCount: 100, spread: 80, startVelocity: 42 });
  confettiBurst({ ...origin, particleCount: 50, spread: 120, scalar: 0.9, ticks: 200 });

  window.setTimeout(() => {
    confettiBurst({ ...origin, particleCount: 40, spread: 60, startVelocity: 32, angle: 60 });
    confettiBurst({ ...origin, particleCount: 40, spread: 60, startVelocity: 32, angle: 120 });
  }, 140);
}

function confettiBurst(options: ConfettiBurstOptions) {
  confetti({
    disableForReducedMotion: true,
    colors: ["#FFFFFF", "#FFD60A", "#FF9F0A", "#FDE68A", "#FBBF24"],
    zIndex: 99999,
    useWorker: false,
    ...options,
  });
}

interface ConfettiBurstOptions {
  particleCount: number;
  spread: number;
  origin: { x: number; y: number };
  startVelocity?: number;
  scalar?: number;
  ticks?: number;
  angle?: number;
}
