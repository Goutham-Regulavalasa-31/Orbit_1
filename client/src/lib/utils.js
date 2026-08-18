import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS class strings safely.
 * Uses clsx for conditional class logic and tailwind-merge
 * to resolve conflicting utility classes (last one wins).
 *
 * @param {...(string | undefined | null | boolean | object)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
