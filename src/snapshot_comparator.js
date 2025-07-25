// @ts-check

import { FileEntry } from "./fileentry.js";
import { Snapshot } from "./snapshot.js";

/**
 * Compares two directory snapshot files and returns the differences.
 *
 * @param {string} snapshot_path_1 - The path to the first snapshot file to be compared.
 * @param {string} snapshot_path_2 - The path to the second snapshot file to be compared.
 * @returns {Promise<{added: FileEntry[], deleted: FileEntry[], modifiedDate: {oldValue: FileEntry, newValue: FileEntry}[], modifiedContent: {oldValue: FileEntry, newValue: FileEntry}[]}>} A promise that resolves with an object containing the differences
 * between the two snapshots. The object may include added, removed, and modified entries.
 */
export async function compareSnapshots(snapshot_path_1, snapshot_path_2) {
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

    const summary = {
        /** @type {FileEntry[]} */
        added: [],
        /** @type {FileEntry[]} */
        deleted: [],
        /** @type {{oldValue: FileEntry, newValue: FileEntry}[]} */
        modifiedDate: [],
        /** @type {{oldValue: FileEntry, newValue: FileEntry}[]} */
        modifiedContent: [],
    };

    const snap_older =
        snapshot_1.header.createdAt < snapshot_2.header.createdAt
            ? snapshot_1
            : snapshot_2;
    const snap_newer =
        snapshot_1.header.createdAt < snapshot_2.header.createdAt
            ? snapshot_2
            : snapshot_1;

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
                    summary.modifiedContent.push({
                        oldValue: old_entry,
                        newValue: entry,
                    });
                    continue;
                }

                if (entry.size !== old_entry.size) {
                    summary.modifiedContent.push({
                        oldValue: old_entry,
                        newValue: entry,
                    });
                    continue;
                }
            }

            if (entry.ctime !== old_entry.ctime) {
                summary.modifiedDate.push({
                    oldValue: old_entry,
                    newValue: entry,
                });
                continue;
            }

            if (entry.mtime !== old_entry.mtime) {
                summary.modifiedDate.push({
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

    return summary;
}
