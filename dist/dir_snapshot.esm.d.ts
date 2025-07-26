export class Snapshot {
    /**
     * Constructs a new Snapshot instance with the specified path.
     * @param {string} path - The path to the snapshot file or null if created from scratch.
     */
    constructor(path: string);
    /**
     * The path to the snapshot file from which this snapshot was created or null if this snapshot was created from scratch.
     * @type {string|null}
     * @readonly
     */
    readonly get path(): string | null;
    /**
     * Checks if the snapshot object is opened.
     * @returns {boolean} True if the snapshot object is opened, otherwise false.
     */
    isOpened(): boolean;
    /**
     * The header of the snapshot. Contains metadata like rootPath, createdAt, machineId, version, and type.
     * @type {{rootPath: string, createdAt: string, machineId?: string, version?: string, type: "dir-snapshot"}}
     * @readonly
     * @throws {Error} If the snapshot has not been opened.
     */
    readonly get header(): {
        rootPath: string;
        createdAt: string;
        machineId?: string;
        version?: string;
        type: "dir-snapshot";
    };
    /**
     * The entries of the snapshot. A Map where the keys are the paths of the entries and the values are the parsed JSON objects.
     * @type {Map<string, FileEntry>}
     * @readonly
     * @throws {Error} If the snapshot has not been opened.
     */
    readonly get entries(): Map<string, FileEntry>;
    /**
     * The footer of the snapshot. Contains information about the success or failure of creating the snapshot.
     * @type {{status: "success"}|{status: "error", message: string}}
     * @readonly
     * @throws {Error} If the snapshot has not been opened.
     */
    readonly get footer(): {
        status: "success";
    } | {
        status: "error";
        message: string;
    };
    /**
     * Reads a snapshot file and populates this object with the data.
     * @returns {Promise<boolean>} A promise that resolves with true if the snapshot is valid and this object is populated, otherwise false.
     */
    open(): Promise<boolean>;
    #private;
}
/**
 * Compares two directory snapshot files and returns the differences.
 *
 * @param {string} snapshot_path_1 - The path to the first snapshot file to be compared.
 * @param {string} snapshot_path_2 - The path to the second snapshot file to be compared.
 * @returns {Promise<Report>} A promise that resolves with an object containing the differences
 * between the two snapshots. The object may include added, removed, and modified entries.
 */
export function compareSnapshots(snapshot_path_1: string, snapshot_path_2: string): Promise<Report>;
/**
 * Scans a directory and writes data to a file, excluding specified paths
 * @param {{ outputFile: string, dirPath: string, excludePaths?: Array<string|RegExp>, maxDepth?: number, machineId?: string, metadata?: Object }} options
 * @returns {Promise<boolean>} A promise that resolves with true if the snapshot is valid and this object is populated, otherwise false
 */
export function createSnapshot(options: {
    outputFile: string;
    dirPath: string;
    excludePaths?: Array<string | RegExp>;
    maxDepth?: number;
    machineId?: string;
    metadata?: any;
}): Promise<boolean>;
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
export function generateSnapshotName(prefix?: string, extension?: string): string;
/**
 * Validates a directory snapshot file.
 * @param {string} filePath - The path to the snapshot file to be validated.
 * @returns {Promise<boolean>} A promise that resolves with true if the snapshot is valid, otherwise false.
 */
export function validateSnapshot(filePath: string): Promise<boolean>;
declare class FileEntry {
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
    constructor(path: string, type: "file" | "directory", ctime: string, mtime: string, depth: number, size?: number, sha256?: string);
    path: string;
    type: "file" | "directory";
    size: number;
    ctime: string;
    mtime: string;
    sha256: string;
    depth: number;
}
declare class Report {
    /** @type {FileEntry[]} */
    added: FileEntry[];
    /** @type {FileEntry[]} */
    deleted: FileEntry[];
    /** @type {{src: FileEntry, dst: FileEntry}[]} */
    moved: {
        src: FileEntry;
        dst: FileEntry;
    }[];
    /** @type {{oldValue: FileEntry, newValue: FileEntry}[]} */
    metaDataChanged: {
        oldValue: FileEntry;
        newValue: FileEntry;
    }[];
    /** @type {{oldValue: FileEntry, newValue: FileEntry}[]} */
    contentChanged: {
        oldValue: FileEntry;
        newValue: FileEntry;
    }[];
    period: {
        start: string;
        end: string;
    };
    /**
     * Converts the report object into a JSON-serializable format.
     *
     * @returns {{period:{start:string, end:string}, added:FileEntry[], metaDataChanged:{oldValue:FileEntry, newValue:FileEntry}[], contentChanged:{oldValue:FileEntry, newValue:FileEntry}[], moved:{src:FileEntry, dst:FileEntry}[], deleted:FileEntry[]}} An object containing the report details, such as the creation date,
     *                   lists of added, deleted, moved, metadata changed, and content changed entries.
     */
    toJSON(): {
        period: {
            start: string;
            end: string;
        };
        added: FileEntry[];
        metaDataChanged: {
            oldValue: FileEntry;
            newValue: FileEntry;
        }[];
        contentChanged: {
            oldValue: FileEntry;
            newValue: FileEntry;
        }[];
        moved: {
            src: FileEntry;
            dst: FileEntry;
        }[];
        deleted: FileEntry[];
    };
}
export {};
