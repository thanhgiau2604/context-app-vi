// SHA-256 hash of "roundSalt:normalizedTerm" using Web Crypto API
// Used as termIndex document ID so keyword cannot be reverse-engineered
export async function hashTerm(roundSalt: string, normalizedTerm: string): Promise<string> {
  const input = `${roundSalt}:${normalizedTerm}`
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
