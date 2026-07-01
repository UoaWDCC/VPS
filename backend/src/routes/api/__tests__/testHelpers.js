/**
 * Shared test helpers for API route tests.
 */

/**
 * Returns an axios config object with a Bearer Authorization header.
 * @param {string} id - The uid/token to use as the Bearer value.
 */
export function authHeaders(id) {
  return { headers: { Authorization: `Bearer ${id}` } };
}
