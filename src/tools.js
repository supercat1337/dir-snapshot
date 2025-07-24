// @ts-check

/**
 * Generates a snapshot filename with a timestamp.
 * The filename format is: `prefix.YYYY-MM-DD.HH-MM-SS.extension`
 * 
 * @param {string} [prefix="snapshot"] - The prefix to be used in the filename
 * @param {string} [extension="ndjson"] - The file extension to be used
 * @returns {string} The generated filename with timestamp
 * @example
 * // returns "snapshot.2023-05-15.14-30-45.ndjson"
 * generateSnapshotName();
 * @example
 * // returns "backup.2023-05-15.14-30-45.json"
 * generateSnapshotName("backup", "json");
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
