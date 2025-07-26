import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import 'readline';
import { createInterface } from 'node:readline';
import { readdir, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';

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

/**
 * Checks if an object has all the specified properties
 * @param {Object} obj - The object to be checked
 * @param {Array<string>} properties - The properties to be checked for
 * @returns {boolean} Whether the object has all the specified properties or not
 */
function hasProperties(obj, properties) {
  return properties.every((property) => property in obj);
}

/**
 * Checks if a given string matches the ISO 8601 date format.
 *
 * @param {string} dateString - The string to be validated against the ISO 8601 format.
 * @returns {boolean} True if the string is in the ISO 8601 format, otherwise false.
 */
function isIsoDateString(dateString) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateString);
}

// @ts-check


/**
 * Validates a directory snapshot file.
 * @param {string} filePath - The path to the snapshot file to be validated.
 * @returns {Promise<boolean>} A promise that resolves with true if the snapshot is valid, otherwise false.
 */
async function validateSnapshot(filePath) {
    const fileStream = createReadStream(filePath, { encoding: "utf-8" });
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let expectedHeader = true;
    let expectedFooterOrEntry = false;
    let expectedNoData = false;

    let isValid = false;

    try {
        for await (const line of rl) {
            if (expectedHeader) {
                if (isHeader(line)) {
                    expectedHeader = false;
                    expectedFooterOrEntry = true;
                } else {
                    throw new Error(`Invalid header: ${line}`);
                }
            } else if (expectedFooterOrEntry) {
                if (isFooter(line)) {
                    expectedFooterOrEntry = false;
                    expectedNoData = true;

                    let footer = JSON.parse(line);
                    if (footer.status !== "success") {
                        console.warn(
                            `Snapshot has status: ${footer.status}, but should be "success"`
                        );
                        if (footer.message) {
                            console.warn(
                                `Snapshot has message: ${footer.message}`
                            );
                        }
                        throw new Error("Snapshot is invalid: " + line);
                    }
                } else if (isDirectoryEntry(line)) {
                    // do nothing
                } else {
                    throw new Error(`Invalid footer or entry: ${line}`);
                }
            } else if (expectedNoData) {
                if (line !== "") throw new Error(`Unexpected data: ${line}`);
            }
        }

        isValid = true;
    } catch (error) {
        console.error(error.message);
    }

    rl.close();
    return isValid;
}

/**
 * Determines if a given line is a valid header for a directory snapshot.
 * The header is considered valid if it is a JSON object with the correct type and contains
 * all required properties: "version", "type", "createdAt", "machineId", and "rootPath".
 *
 * @param {string} line - The line to be checked, expected to be a JSON string.
 * @returns {boolean} True if the line is a valid header, otherwise false.
 */
function isHeader(line) {
    let header = JSON.parse(line);
    return (
        header.type === "dir-snapshot" &&
        isIsoDateString(header.createdAt) &&
        hasProperties(header, [
            "version",
            "type",
            "createdAt",
            "machineId",
            "rootPath",
        ])
    );
}

/**
 * Determines if a given line is a valid directory entry for a directory snapshot.
 * The directory entry is considered valid if it is a JSON object with the correct type and contains
 * all required properties: "path", "type", "size", "ctime", "mtime", and "depth".
 *
 * @param {string} line - The line to be checked, expected to be a JSON string.
 * @returns {boolean} True if the line is a valid directory entry, otherwise false.
 */
function isDirectoryEntry(line) {
    let entry = JSON.parse(line);
    return hasProperties(entry, [
        "path",
        "type",
        "ctime",
        "mtime",
        "depth",
    ]);
}

/**
 * Determines if a given line is a valid footer for a directory snapshot.
 * The footer is considered valid if it is a JSON object with a "status" property.
 *
 * @param {string} line - The line to be checked, expected to be a JSON string.
 * @returns {boolean} True if the line is a valid footer, otherwise false.
 */
function isFooter(line) {
    let footer = JSON.parse(line);
    return hasProperties(footer, ["status"]);
}

// @ts-check

class FileEntry {
    /**
     * Constructor for FileEntry
     *
     * @param {string} path - the path to the file/directory
     * @param {"file"|"directory"} type - the type of the entry
     * @param {string} ctime - the creation time of the file in ISO format
     * @param {string} mtime - the modification time of the file in ISO format
     * @param {number} depth - the depth of the file/directory relative to the root directory
     * @param {number} [size] - the size of the file in bytes
     * @param {string} [sha256] - the SHA-256 hash of the file, only for files
     */
    constructor(path, type, ctime, mtime, depth, size, sha256) {
        this.path = path;
        this.type = type;
        this.size = size;
        this.ctime = ctime;
        this.mtime = mtime;
        this.sha256 = sha256;
        this.depth = depth;
    }
}

// @ts-check


/**
 * Scans a directory and writes data to a file, excluding specified paths
 * @param {{ outputFile: string, dirPath: string, excludePaths?: Array<string|RegExp>, maxDepth?: number, machineId?: string, metadata?: Object }} options
 * @returns {Promise<boolean>} A promise that resolves with true if the snapshot is valid and this object is populated, otherwise false
 */
async function createSnapshot(options) {
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
    let result = true;

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
        writer.write(footer);
    } catch (error) {
        console.error("Error processing directory:", error);
        let footer = JSON.stringify({status: "error", message: error.message});
        writer.write(footer);
        result = false;
    }

    writer.end();
    return result;
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
        let record = new FileEntry(
            absolutePath,
            stats.isDirectory() ? "directory" : "file",
            stats.ctime.toISOString(),
            stats.mtime.toISOString(),
            currentDepth, 
        );

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
 * Reads a directory snapshot file and parses its contents into an object.
 * @param {string} filePath - The path to the snapshot file to be read.
 * @returns {Promise<{header: {rootPath: string, createdAt: string, machineId?: string, version?: string, type: "dir-snapshot"}, entries: Map<string, FileEntry>, footer: {status: "success"}|{status: "error", message: string}}>} A promise that resolves with an object
 * containing the header, entries, and footer of the snapshot. The `entries` property is a Map where the keys are the paths
 * of the entries and the values are the parsed JSON objects.
 */
async function readSnapshot(filePath) {
    const fileStream = createReadStream(filePath, { encoding: "utf-8" });
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    /** @type {{rootPath: string, createdAt: string, machineId?: string, version?: string, type: "dir-snapshot"}|null} */
    let header = null;
    /** @type {Map<string, FileEntry>} */
    let entries = new Map();
    /** @type {{status: "success"}|{status: "error", message: string}|null} */
    let footer = null;

    for await (const line of rl) {
        let data = JSON.parse(line);

        if (data.rootPath) {
            header = data;
        } else if (data.status) {
            footer = data;
        } else if (data.path) {
            entries.set(data.path, data);
        }
    }

    if (!header || !footer) {
        throw new Error("Invalid snapshot file format.");
    }

    return { header, entries, footer };
}

// @ts-check


class Snapshot {
    /** @type {{rootPath: string, createdAt: string, machineId?: string, version?: string, type: "dir-snapshot"}} */
    #header;
    /** @type {Map<string, FileEntry>} */
    #entries = new Map();
    /** @type {{status: "success"}|{status: "error", message: string}} */
    #footer;

    #isOpened = false;
    /** @type {string} */
    #path;

    /**
     * Constructs a new Snapshot instance with the specified path.
     * @param {string} path - The path to the snapshot file or null if created from scratch.
     */
    constructor(path) {
        if (!existsSync(path)) {
            throw new Error("Snapshot file does not exist.");
        }

        this.#path = path;
    }

    /**
     * The path to the snapshot file from which this snapshot was created or null if this snapshot was created from scratch.
     * @type {string|null}
     * @readonly
     */
    get path() {
        return this.#path;
    }

    /**
     * Checks if the snapshot object is opened.
     * @returns {boolean} True if the snapshot object is opened, otherwise false.
     */
    isOpened() {
        return this.#isOpened;
    }

    /**
     * The header of the snapshot. Contains metadata like rootPath, createdAt, machineId, version, and type.
     * @type {{rootPath: string, createdAt: string, machineId?: string, version?: string, type: "dir-snapshot"}}
     * @readonly
     * @throws {Error} If the snapshot has not been opened.
     */
    get header() {
        if (!this.#isOpened) {
            throw new Error("Snapshot is not opened.");
        }   
        return this.#header;
    }

    /**
     * The entries of the snapshot. A Map where the keys are the paths of the entries and the values are the parsed JSON objects.
     * @type {Map<string, FileEntry>}
     * @readonly
     * @throws {Error} If the snapshot has not been opened.
     */
    get entries() {
        if (!this.#isOpened) {
            throw new Error("Snapshot is not opened.");
        }   
        return this.#entries;
    }

    /**
     * The footer of the snapshot. Contains information about the success or failure of creating the snapshot.
     * @type {{status: "success"}|{status: "error", message: string}}
     * @readonly
     * @throws {Error} If the snapshot has not been opened.
     */
    get footer() {
        if (!this.#isOpened) {
            throw new Error("Snapshot is not opened.");
        }   
        return this.#footer;
    }

    /**
     * Reads a snapshot file and populates this object with the data.
     * @returns {Promise<boolean>} A promise that resolves with true if the snapshot is valid and this object is populated, otherwise false.
     */
    async open() {
        if (this.isOpened()) {
            throw new Error("Cannot open snapshot again. Create a new instance of Snapshot instead.");
        }

        let snaphotPath = this.#path;

        let isValid = await validateSnapshot(snaphotPath);

        if (!isValid) {
            throw new Error("Snapshot file is invalid.");
        }

        try {
            let snapshot = await readSnapshot(snaphotPath);
            this.#header = snapshot.header;
            this.#entries = snapshot.entries;
            this.#footer = snapshot.footer;
            this.#isOpened = true;
            return true;
        } catch (error) {
            this.#isOpened = false;
            return false;
        }
    }
}

// @ts-check


class Report {
    /** @type {FileEntry[]} */
    added = [];
    /** @type {FileEntry[]} */
    deleted = [];
    /** @type {{src: FileEntry, dst: FileEntry}[]} */
    moved = [];
    /** @type {{oldValue: FileEntry, newValue: FileEntry}[]} */
    metaDataChanged = [];
    /** @type {{oldValue: FileEntry, newValue: FileEntry}[]} */
    contentChanged = [];
    period = {
        start: "",
        end: "",
    };

    /**
     * Converts the report object into a JSON-serializable format.
     *
     * @returns {{period:{start:string, end:string}, added:FileEntry[], metaDataChanged:{oldValue:FileEntry, newValue:FileEntry}[], contentChanged:{oldValue:FileEntry, newValue:FileEntry}[], moved:{src:FileEntry, dst:FileEntry}[], deleted:FileEntry[]}} An object containing the report details, such as the creation date,
     *                   lists of added, deleted, moved, metadata changed, and content changed entries.
     */
    toJSON() {
        return {
            period: this.period,
            added: this.added,
            metaDataChanged: this.metaDataChanged,
            contentChanged: this.contentChanged,
            moved: this.moved,
            deleted: this.deleted,
        };
    }
}

/**
 * Compares two directory snapshot files and returns the differences.
 *
 * @param {string} snapshot_path_1 - The path to the first snapshot file to be compared.
 * @param {string} snapshot_path_2 - The path to the second snapshot file to be compared.
 * @returns {Promise<Report>} A promise that resolves with an object containing the differences
 * between the two snapshots. The object may include added, removed, and modified entries.
 */
async function compareSnapshots(snapshot_path_1, snapshot_path_2) {
    const snapshot_1 = new Snapshot(snapshot_path_1);
    const snapshot_2 = new Snapshot(snapshot_path_2);

    await Promise.all([snapshot_1.open(), snapshot_2.open()]);

    if (snapshot_1.header.rootPath !== snapshot_2.header.rootPath) {
        throw new Error(
            "Snapshots are not for the same directory: " +
                snapshot_1.header.rootPath +
                " vs " +
                snapshot_2.header.rootPath
        );
    }

    if (snapshot_1.header.createdAt === snapshot_2.header.createdAt) {
        throw new Error(
            "Snapshots are the same: " + snapshot_1.header.createdAt
        );
    }

    const summary = new Report();

    const snap_older =
        snapshot_1.header.createdAt < snapshot_2.header.createdAt
            ? snapshot_1
            : snapshot_2;
    const snap_newer =
        snapshot_1.header.createdAt < snapshot_2.header.createdAt
            ? snapshot_2
            : snapshot_1;

    summary.period.start = snap_older.header.createdAt;
    summary.period.end = snap_newer.header.createdAt;

    for (const [path, entry] of snap_newer.entries) {
        let old_entry = snap_older.entries.get(path);

        if (!old_entry) {
            summary.added.push(entry);
            continue;
        } else {
            if (entry.type !== old_entry.type) {
                summary.deleted.push(old_entry);
                summary.added.push(entry);
                continue;
            }

            if (entry.type === "file") {
                if (entry.sha256 !== old_entry.sha256) {
                    summary.contentChanged.push({
                        oldValue: old_entry,
                        newValue: entry,
                    });
                    continue;
                }

                if (entry.size !== old_entry.size) {
                    summary.contentChanged.push({
                        oldValue: old_entry,
                        newValue: entry,
                    });
                    continue;
                }
            }

            if (entry.ctime !== old_entry.ctime) {
                summary.metaDataChanged.push({
                    oldValue: old_entry,
                    newValue: entry,
                });
                continue;
            }

            if (entry.mtime !== old_entry.mtime) {
                summary.metaDataChanged.push({
                    oldValue: old_entry,
                    newValue: entry,
                });
                continue;
            }
        }
    }

    for (const [path, old_entry] of snap_older.entries) {
        let entry = snap_newer.entries.get(path);

        if (!entry) {
            summary.deleted.push(old_entry);
        }
    }

    // detect moved files

    for (let i = 0; i < summary.deleted.length; i++) {
        for (let j = 0; j < summary.added.length; j++) {
            if (
                summary.deleted[i].type === "file" &&
                summary.added[j].type === "file" &&
                summary.deleted[i].size === summary.added[j].size &&
                summary.deleted[i].sha256 === summary.added[j].sha256
            ) {
                summary.moved.push({
                    src: summary.deleted[i],
                    dst: summary.added[j],
                });

                summary.deleted.splice(i, 1);
                summary.added.splice(j, 1);
                i--;
                j--;
            }
        }
    }

    return summary;
}

export { Snapshot, compareSnapshots, createSnapshot, generateSnapshotName, validateSnapshot };
