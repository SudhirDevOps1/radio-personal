import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type { ClassValue };

// ─── Merge Cache ────────────────────────────────────────────────────────────
// twMerge is regex-heavy and expensive. Cache repeated inputs.
const cache = new Map<string, string>();
const MAX_CACHE_SIZE = 512;

export function cn(...inputs: ClassValue[]): string {
    // Fast path: empty input
    if (inputs.length === 0) return "";

    // Fast path: single string, no spaces → no merge conflict possible
    if (
        inputs.length === 1 &&
        typeof inputs[0] === "string" &&
        !inputs[0].includes(" ")
    ) {
        return inputs[0];
    }

    // Collapse inputs with clsx first
    const raw = clsx(inputs);

    // Fast path: empty result
    if (!raw) return "";

    // Return cached merge if available
    const cached = cache.get(raw);
    if (cached !== undefined) return cached;

    // Perform expensive merge
    const result = twMerge(raw);

    // Evict oldest entry if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
    }

    cache.set(raw, result);
    return result;
}

// Clear cache (useful for tests / HMR)
cn.clearCache = () => cache.clear();
