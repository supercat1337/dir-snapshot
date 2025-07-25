// @ts-check

export class FileEntry {
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

export class Header {
    /**
     * Constructs a new Header instance with the specified metadata.
     * 
     * @param {string} version - The version of the directory snapshot.
     * @param {string} type - The type of the snapshot, expected to be "dir-snapshot".
     * @param {string} createdAt - The creation timestamp of the snapshot in ISO format.
     * @param {string} machineId - The identifier for the machine where the snapshot was created.
     * @param {string} rootPath - The root path of the directory being snapshotted.
     */
    constructor(version, type, createdAt, machineId, rootPath) {
        this.version = version;
        this.type = type;
        this.createdAt = createdAt;
        this.machineId = machineId;
        this.rootPath = rootPath;
    }
}

export class Footer {
    /**
     * Constructs a new Footer instance with the specified status and message.
     * @param {"success"|"error"} status - The status of the snapshot operation.
     * @param {string} [message] - An optional message with additional information if the status is "error".
     */
    constructor(status, message) {
        this.status = status;
        this.message = message;
    }
}