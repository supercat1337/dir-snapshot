// @ts-check

import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { FileEntry } from "./fileentry.js";

/**
 * Reads a directory snapshot file and parses its contents into an object.
 * @param {string} filePath - The path to the snapshot file to be read.
 * @returns {Promise<{header: {rootPath: string, createdAt: string, machineId?: string, version?: string, type: "dir-snapshot"}, entries: Map<string, FileEntry>, footer: {status: "success"}|{status: "error", message: string}}>} A promise that resolves with an object
 * containing the header, entries, and footer of the snapshot. The `entries` property is a Map where the keys are the paths
 * of the entries and the values are the parsed JSON objects.
 */
export async function readSnapshot(filePath) {
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

