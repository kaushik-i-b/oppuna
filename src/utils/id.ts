/**
 * Generates a RFC4122-version-4-style identifier using Math.random.
 * This is sufficient for local primary keys; it is not used for security.
 */
export function createId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}
