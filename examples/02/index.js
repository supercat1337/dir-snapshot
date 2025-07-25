// @ts-check

import {
    generateSnapshotName,
    createSnapshot,
    validateSnapshot,
} from "../../dist/dir_snapshot.esm.js";
const __dirname = import.meta.dirname;

const outputFile = __dirname + "/" + generateSnapshotName();

// Example usage
const excludePaths = [/\.gitignore/];

console.warn("Attempting to create snapshot from a directory that does not exist");

await createSnapshot({
    outputFile,
    dirPath: "./qwerty",
    excludePaths,
    machineId: "my-machine-id",
});

let isValid = await validateSnapshot(outputFile);
console.log(`Snapshot is valid: ${isValid}`);
