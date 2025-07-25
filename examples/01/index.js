// @ts-check

import {
    generateSnapshotName,
    createSnapshot,
} from "../../dist/dir_snapshot.esm.js";
const __dirname = import.meta.dirname;

const snapshotPath = __dirname + "/" + generateSnapshotName('project-snapshot');
const options = {
    outputFile: snapshotPath,
    dirPath: '.',
    excludePaths: ['node_modules', /\.git/],
    maxDepth: 10,
    machineId: 'build-server-01',
    metadata: { project: 'my-project', version: '1.0.0' }
};

createSnapshot(options).then(success => {
    if (success) {
        console.log(`Snapshot created: ${snapshotPath}`);
    }
});
