// @ts-check

import { FileEntry } from "./fileentry.js";
import { readSnapshot } from "./snapshot_reader.js";
import { validateSnapshot } from "./snapshot_validator.js";
import { existsSync } from "node:fs";

export class Snapshot {
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
