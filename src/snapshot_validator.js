// @ts-check

import { createReadStream } from "node:fs";
import { hasProperties, isIsoDateString } from "./tools.js";
import { createInterface } from "node:readline";

/**
 * Validates a directory snapshot file.
 * @param {string} filePath - The path to the snapshot file to be validated.
 * @returns {Promise<boolean>} A promise that resolves with true if the snapshot is valid, otherwise false.
 */
export async function validateSnapshot(filePath) {
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
 * Determines if a given line is a valid file entry for a directory snapshot.
 * The file entry is considered valid if it is a JSON object with the correct type and contains
 * all required properties: "path", "type", "size", "ctime", "mtime", "sha256", and "depth".
 *
 * @param {string} line - The line to be checked, expected to be a JSON string.
 * @returns {boolean} True if the line is a valid file entry, otherwise false.
 */
function isFileEntry(line) {
    let entry = JSON.parse(line);
    return hasProperties(entry, [
        "path",
        "type",
        "size",
        "ctime",
        "mtime",
        "sha256",
        "depth",
    ]);
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
