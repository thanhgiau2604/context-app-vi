// Normalize Vietnamese input for consistent Firestore hash lookups
export function normalizeVietnamese(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()\[\]{}"']/g, '')
    .replace(/\s+/g, ' ')
}
