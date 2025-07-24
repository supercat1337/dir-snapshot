// @ts-check

import { generateSnapshotName, scanToFile } from "../dist/dir_snapshot_tool.esm.js";

const outputFile = "./example/" + generateSnapshotName();

// Example usage
const excludePaths = [
  "/home/user/project/node_modules",
  "/home/user/project/.git",
];

scanToFile({
  outputFile,
  dirPath: "./",
  excludePaths,
  machineId: "my-machine-id",
})
  .then(() => console.log("Scanning completed"))
  .catch(console.error);
