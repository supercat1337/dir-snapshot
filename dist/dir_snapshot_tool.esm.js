import { createReadStream, createWriteStream } from 'node:fs';
import { readdir, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

// @ts-check


/**
 * Asynchronously computes the SHA-256 hash of a file.
 *
 * @param {string} filePath - The path to the file for which the hash will be computed.
 * @returns {Promise<string>} A promise that resolves with the hexadecimal string of the file's hash.
 */
const calculateFileHash = async (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

// @ts-check


/**
 * File system entry metadata
 * @typedef {Object} FileEntry
 * @property {string} path
 * @property {'file'|'directory'} type
 * @property {number} [size]
 * @property {string} ctime
 * @property {string} mtime
 * @property {string} [sha256] - Only for files
 * @property {number} depth
 */

/**
 * Scans a directory and writes data to a file, excluding specified paths
 * @param {{ outputFile: string, dirPath: string, excludePaths?: string[], maxDepth?: number, machineId?: string, metadata?: Object }} options
 */
async function scanToFile(options) {
    const {
        outputFile,
        dirPath,
        excludePaths = [],
        maxDepth = Infinity,
        machineId = "unknown",
        metadata = {},
    } = options;

    const writer = createWriteStream(outputFile, { flags: "w" });
    const rootPath = resolve(dirPath);

    const header = {
        version: "1.0",
        type: "dir-snapshot",
        createdAt: new Date().toISOString(),
        machineId: machineId,
        rootPath: rootPath.replace(/\\/g, "/"),
        ...metadata,
    };

    writer.write(`${JSON.stringify(header)}\n`);
    try {
        await processDirectory(rootPath, writer, excludePaths, maxDepth);
        let footer = JSON.stringify({status: "success"});
        writer.write(footer + "\n");
    } catch (error) {
        console.error("Error processing directory:", error);
        let footer = JSON.stringify({status: "error", message: error.message});
        writer.write(footer + "\n");
    }

    writer.end();
}

/**
 * Recursively processes a directory and writes data to a file, excluding specified paths
 * @param {string} currentPath - Current directory being processed
 * @param {import('node:fs').WriteStream} writer - File writer
 * @param {Array<string|RegExp>} excludePaths - Set of absolute paths to exclude
 * @param {number} [depth=Infinity] - Maximum recursion depth
 * @param {number} [currentDepth=0] - Current recursion depth
 */
async function processDirectory(
    currentPath,
    writer,
    excludePaths = [],
    depth = Infinity,
    currentDepth = 0
) {
    if (shouldExclude(resolve(currentPath), excludePaths)) return;

    const items = await readdir(currentPath);

    for (const item of items) {
        const fullPath = join(currentPath, item);
        const absolutePath = resolve(fullPath).replace(/\\/g, "/");

        if (shouldExclude(absolutePath, excludePaths)) continue;

        const stats = await lstat(absolutePath);
        /** @type {FileEntry} */
        let record = {
            path: absolutePath, // Save the absolute path
            type: stats.isDirectory() ? "directory" : "file",
            ctime: stats.ctime.toISOString(),
            mtime: stats.mtime.toISOString(),
            depth: currentDepth,
        };

        if (stats.isFile()) {
            record.sha256 = await calculateFileHash(absolutePath);
            record.size = stats.size;
        }

        writer.write(`${JSON.stringify(record)}\n`);

        if (stats.isDirectory() && currentDepth < depth) {
            await processDirectory(
                absolutePath,
                writer,
                excludePaths,
                depth,
                currentDepth + 1
            );
        }
    }
}

/**
 * Checks if a given absolute path should be excluded based on a set of rules
 * @param {string} absolutePath - The absolute path to check
 * @param {Array<string|RegExp>} excludePaths - The set of rules to check against
 * @returns {boolean} Whether the path should be excluded or not
 */
function shouldExclude(absolutePath, excludePaths) {
    return excludePaths.some((rule) => {
        if (typeof rule === "string") {
            return resolve(rule) === absolutePath;
        } else if (rule instanceof RegExp) {
            return rule.test(absolutePath);
        }
        return false;
    });
}

// @ts-check

/**
 * Generates a string representing the current time in the format
 * "YYYY-MM-DD-HH-MM-SS" to be used as a filename for a snapshot.
 *
 * @param {string} [prefix="snapshot"] - The prefix to be used in the filename
 * @param {string} [extension="ndjson"] - The file extension to be used
 * @returns {string}
 */
function generateSnapshotName(prefix = "snapshot", extension = "ndjson") {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${prefix}.${year}-${month}-${day}.${hours}-${minutes}-${seconds}.${extension}`
}

export { generateSnapshotName, scanToFile };
