// @ts-check

/**
 * Generates a string representing the current time in the format
 * "YYYY-MM-DD-HH-MM-SS" to be used as a filename for a snapshot.
 *
 * @param {string} [prefix="snapshot"] - The prefix to be used in the filename
 * @param {string} [extension="ndjson"] - The file extension to be used
 * @returns {string}
 */
export function generateSnapshotName(prefix = "snapshot", extension = "ndjson") {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${prefix}.${year}-${month}-${day}.${hours}-${minutes}-${seconds}.${extension}`
}
