import { describe, expect, it } from "vitest";
import { counterValueAt, defaultCounterOptions as opts } from "../counter";

describe("licznik prowizji (liczarka banknotów)", () => {
  it("startuje od 0 i kończy dokładnie na kwocie", () => {
    expect(counterValueAt(0, 4850, opts)).toBe(0);
    expect(counterValueAt(opts.duration, 4850, opts)).toBe(4850);
    expect(counterValueAt(opts.duration + 500, 4850.5, opts)).toBe(4850.5);
  });

  it("nigdy nie maleje i nie przekracza kwoty", () => {
    let prev = 0;
    for (let t = 0; t <= opts.duration; t += 16) {
      const v = counterValueAt(t, 4850, opts);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeLessThanOrEqual(4850);
      prev = v;
    }
  });

  it("szybko na początku: po 1/3 czasu jest już ponad połowa kwoty", () => {
    expect(counterValueAt(opts.duration / 3, 10_000, opts)).toBeGreaterThan(5_000);
  });

  it("ostatnie złotówki pojedynczo — w fazie końcowej skok co 1 zł", () => {
    const fastEnd = opts.duration * opts.fastShare;
    const seen = new Set<number>();
    for (let t = fastEnd; t < opts.duration; t += 4) seen.add(counterValueAt(t, 1000, opts));
    const values = [...seen].sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) expect(values[i] - values[i - 1]).toBe(1);
    expect(values[0]).toBe(1000 - opts.tailSteps);
  });

  it("małe kwoty (mniej niż liczba kroków) też działają", () => {
    expect(counterValueAt(opts.duration * 0.9, 3, opts)).toBeLessThanOrEqual(3);
    expect(counterValueAt(opts.duration, 3, opts)).toBe(3);
  });
});
