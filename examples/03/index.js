// @ts-check

import fs from "fs";
import path from "path";
import {
    createSnapshot,
    compareSnapshots,
    generateSnapshotName,
} from "../../dist/dir_snapshot.esm.js";

const __dirname = import.meta.dirname;

// Utility to create a directory with parent folders
const mkdirSyncRecursive = (dirPath) => {
    fs.mkdirSync(dirPath, { recursive: true });
};

// Utility to create a file with content
const createFileWithContent = (filePath, content) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        mkdirSyncRecursive(dir);
    }
    fs.writeFileSync(filePath, content);
};

// 1. Create test structure
const testDir = path.join(__dirname, "test-structure");
if (fs.existsSync(testDir)) {
    // Remove if already exists
    fs.rmSync(testDir, { recursive: true, force: true });
}

// Create folder and file structure
mkdirSyncRecursive(testDir);

// First-level files
createFileWithContent(path.join(testDir, "file1.txt"), "Initial content 1");
createFileWithContent(path.join(testDir, "file2.txt"), "Initial content 2");

// Subfolder with files
mkdirSyncRecursive(path.join(testDir, "subfolder"));

createFileWithContent(
    path.join(testDir, "subfolder", "subfile1.txt"),
    "Sub content 1"
);
createFileWithContent(
    path.join(testDir, "subfolder", "subfile2.txt"),
    "Sub content 2"
);

// Nested subfolder
mkdirSyncRecursive(path.join(testDir, "subfolder", "nested"));
createFileWithContent(
    path.join(testDir, "subfolder", "nested", "deepfile.txt"),
    "Deep content"
);

mkdirSyncRecursive(path.join(testDir, "subfolder2"));

console.log("Initial structure created");

// 2. Create the first snapshot
const snapshot1Path = __dirname + "/snapshots/" + generateSnapshotName("snapshot1");
console.log(`Creating first snapshot at: ${snapshot1Path}`);

await createSnapshot({
    outputFile: snapshot1Path,
    dirPath: testDir,
    excludePaths: [".git", /\.DS_Store/],
});

console.log("First snapshot created");

// 3. Make changes to the structure
console.log("Making changes to the structure...");

// Change file content
fs.writeFileSync(path.join(testDir, "file1.txt"), "Modified content 1");

// Change modification date
fs.utimesSync(path.join(testDir, "subfolder2"), new Date(Date.now() - 1000), new Date(Date.now()));

// Remove file
fs.unlinkSync(path.join(testDir, "file2.txt"));

//*
// Rename subfolder
fs.renameSync(
    path.join(testDir, "subfolder"),
    path.join(testDir, "renamed-folder")
);
//*/

// Create a new subfolder
mkdirSyncRecursive(path.join(testDir, "new-folder"));
createFileWithContent(
    path.join(testDir, "new-folder", "newfile.txt"),
    "Brand new content"
);

console.log("Changes applied");

// 4. Create the second snapshot
const snapshot2Path = __dirname + "/snapshots/" + generateSnapshotName("snapshot2");
console.log(`Creating second snapshot at: ${snapshot2Path}`);

await createSnapshot({
    outputFile: snapshot2Path,
    dirPath: testDir,
    excludePaths: [".git", /\.DS_Store/],
});

console.log("Second snapshot created");

// 5. Compare snapshots
console.log("Comparing snapshots...");
const differences = await compareSnapshots(snapshot1Path, snapshot2Path);

console.log("\nComparison results:");
console.log("Added:", differences.added);
console.log("Moved:", differences.moved);
console.log("Modified files by content:", differences.contentChanged);
console.log("Modified files by metadata:", differences.metaDataChanged);
console.log("Deleted:", differences.deleted);

// Optionally remove the test structure
// fs.rmSync(testDir, { recursive: true, force: true });

