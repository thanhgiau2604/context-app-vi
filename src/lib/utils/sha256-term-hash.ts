import { sha256Hex } from "./sha256-pure-js-fallback";

// SHA-256 hash of "roundSalt:normalizedTerm". Used as termIndex doc ID / keyword hash so the
// keyword cannot be reverse-engineered.
//
// Prefers Web Crypto (`crypto.subtle`); falls back to a pure-JS SHA-256 when it is unavailable.
// `crypto.subtle` only exists in a secure context (https:// or http://localhost) — opening the
// app over a plain-HTTP LAN IP (e.g. http://192.168.x.x) leaves it undefined, which previously
// surfaced as a misleading "connection error" on guess submit. Both paths yield identical digests.
export async function hashTerm(roundSalt: string, normalizedTerm: string): Promise<string> {
  const input = `${roundSalt}:${normalizedTerm}`;
  const data = new TextEncoder().encode(input);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  return sha256Hex(data);
}
