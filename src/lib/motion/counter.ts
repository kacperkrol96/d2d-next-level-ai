/**
 * Krzywa „liczarki banknotów”: najpierw szybko, potem zwalnia,
 * a ostatnie złotówki przeskakują pojedynczo. Funkcja czysta — łatwa do testów.
 */
export interface CounterOptions {
  /** Całkowity czas animacji w ms. */
  duration: number;
  /** Ile ostatnich złotówek liczymy pojedynczo. */
  tailSteps: number;
  /** Jaka część czasu przypada na szybką fazę (0–1). */
  fastShare: number;
}

export const defaultCounterOptions: CounterOptions = { duration: 3000, tailSteps: 9, fastShare: 0.62 };

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

/** Wartość licznika (pełne złote) po `elapsed` ms. Na końcu zwraca dokładnie `target`. */
export function counterValueAt(elapsed: number, target: number, options: CounterOptions = defaultCounterOptions): number {
  if (target <= 0) return target;
  if (elapsed >= options.duration) return target;
  if (elapsed <= 0) return 0;

  const whole = Math.floor(target);
  const tail = Math.min(options.tailSteps, whole);
  const fastTarget = whole - tail;
  const fastTime = options.duration * options.fastShare;

  if (elapsed < fastTime) {
    return Math.floor(easeOutQuint(elapsed / fastTime) * fastTarget);
  }
  if (tail === 0) return whole;
  // Faza pojedynczych złotówek — lekko zwalnia (kolejne kroki coraz dłuższe).
  const t = (elapsed - fastTime) / (options.duration - fastTime);
  const step = Math.floor(Math.sqrt(t) * (tail + 1));
  return Math.min(whole, fastTarget + step);
}
