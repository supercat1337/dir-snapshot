// @ts-check

import { FileEntry } from "./fileentry.js";
import { Snapshot } from "./snapshot.js";


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
    /** @type {string} */
    createdAt = "";

    /**
     * Converts the report object into a JSON-serializable format.
     * 
     * @returns {{createdAt:string, added:FileEntry[], metaDataChanged:{oldValue:FileEntry, newValue:FileEntry}[], contentChanged:{oldValue:FileEntry, newValue:FileEntry}[], moved:{src:FileEntry, dst:FileEntry}[], deleted:FileEntry[]}} An object containing the report details, such as the creation date,
     *                   lists of added, deleted, moved, metadata changed, and content changed entries.
     */
    toJSON() {
        return {
            createdAt: this.createdAt,
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

    const summary = new Report();
    summary.createdAt = snapshot_2.header.createdAt;

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
