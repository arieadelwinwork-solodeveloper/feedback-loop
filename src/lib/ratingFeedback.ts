const PITCH_BY_RATING: Record<number, number> = {
  1: 349.23, // F4 — paling rendah
  2: 440.0, // A4
  3: 554.37, // C#5
  4: 783.99, // G5 — paling tinggi / cheers
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

  const origin = { y: 0.18 };

  confettiBurst({ ...origin, particleCount: 90, spread: 75, startVelocity: 38 });
  confettiBurst({ ...origin, particleCount: 45, spread: 110, scalar: 0.85, ticks: 180 });

  window.setTimeout(() => {
    confettiBurst({ ...origin, particleCount: 35, spread: 55, startVelocity: 28, angle: 60 });
    confettiBurst({ ...origin, particleCount: 35, spread: 55, startVelocity: 28, angle: 120 });
  }, 120);
}

async function confettiBurst(options: ConfettiBurstOptions) {
  const { default: confetti } = await import("canvas-confetti");
  confetti({
    disableForReducedMotion: true,
    colors: ["#FFFFFF", "#F5F5F5", "#E8E8E8", "#FFD60A", "#FF9F0A"],
    zIndex: 9999,
    ...options,
  });
}

interface ConfettiBurstOptions {
  particleCount: number;
  spread: number;
  origin: { y: number };
  startVelocity?: number;
  scalar?: number;
  ticks?: number;
  angle?: number;
}
