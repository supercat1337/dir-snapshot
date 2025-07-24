// @ts-check

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

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
