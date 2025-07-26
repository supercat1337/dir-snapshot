// @ts-check

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { createInterface } from 'readline';

/**
 * Asynchronously computes the SHA-256 hash of a file.
 *
 * @param {string} filePath - The path to the file for which the hash will be computed.
 * @returns {Promise<string>} A promise that resolves with the hexadecimal string of the file's hash.
 */
export const calculateFileHash = async (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};


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

/**
 * Reads a file line by line asynchronously, invoking callbacks for each line read, 
 * when reading is completed, and when an error occurs.
 *
 * @param {string} filePath - The path to the file to be read.
 * @param {(line:string, rl:import('readline').Interface)=>void} callback - Function to be called with each line read from the file.
 * @param {function} [onEnd] - Optional function to be called when the file has been completely read.
 * @param {function} [onError] - Optional function to be called if an error occurs while reading the file.
 */
export function readFileLineByLine(filePath, callback, onEnd, onError) {
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    rl.on('line', (line) => {
        callback(line, rl);
    });

    rl.on('close', () => {
        if (onEnd) onEnd(); 
    });

    fileStream.on('error', (err) => {
        if (onError) onError(err);
    });
}

/**
 * Checks if an object has all the specified properties
 * @param {Object} obj - The object to be checked
 * @param {Array<string>} properties - The properties to be checked for
 * @returns {boolean} Whether the object has all the specified properties or not
 */
export function hasProperties(obj, properties) {
  return properties.every((property) => property in obj);
}

/**
 * Checks if a given string matches the ISO 8601 date format.
 *
 * @param {string} dateString - The string to be validated against the ISO 8601 format.
 * @returns {boolean} True if the string is in the ISO 8601 format, otherwise false.
 */
export function isIsoDateString(dateString) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateString);
}