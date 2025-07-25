# Directory Snapshot Library

A JavaScript library for creating, comparing, and validating directory snapshots. This tool helps track changes in directory structures over time by capturing file metadata and content hashes.

## Features

- Create snapshots of directory structures with metadata
- Compare two snapshots to detect changes (added, removed, modified files)
- Validate snapshot files for integrity
- Customizable snapshot generation with exclusion patterns
- File entry metadata including SHA-256 hashes for content verification

## Installation

```bash
npm install dir-snapshot
```

## Usage

### Creating a Snapshot

```javascript
import { createSnapshot, generateSnapshotName } from 'dir-snapshot';

const snapshotPath = generateSnapshotName('project-snapshot');
const options = {
    outputFile: snapshotPath,
    dirPath: './project-folder',
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
```

### Comparing Snapshots

```javascript
import { compareSnapshots } from 'dir-snapshot';

compareSnapshots('snapshot1.ndjson', 'snapshot2.ndjson').then(report => {
    console.log('Changes detected:', report);
    // Output might include:
    // {
    //   period: {start: "...", end: "..."},
    //   added: [...],
    //   metaDataChanged: [...],
    //   contentChanged: [...],
    //   moved: [...],
    //   deleted: [...],
    // }
});
```

### Validating a Snapshot

```javascript
import { validateSnapshot } from 'dir-snapshot';

validateSnapshot('snapshot.ndjson').then(isValid => {
    console.log('Snapshot is valid:', isValid);
});
```

### Working with Snapshot Objects

```javascript
import { Snapshot } from 'dir-snapshot';

const snapshot = new Snapshot('existing-snapshot.ndjson');
snapshot.open().then(opened => {
    if (opened) {
        console.log('Root path:', snapshot.header.rootPath);
        console.log('Created at:', snapshot.header.createdAt);
        console.log('Total entries:', snapshot.entries.size);
    }
});
```

## API Reference

### Snapshot Class

Represents a directory snapshot with methods to inspect its contents.

**Properties:**

- `header`: Contains metadata about the snapshot (rootPath, createdAt, machineId, version, type)
- `entries`: Map of file entries (key: path, value: FileEntry)
- `footer`: Indicates if the snapshot was successfully created or contains errors
- `path` (readonly): The source path of the snapshot file

**Methods:**

- `isOpened()`: Check if the snapshot is loaded
- `open()`: Load the snapshot data from file

### FileEntry Class

Represents a file or directory entry in the snapshot.

**Properties:**

- `path`: Relative path from snapshot root
- `type`: "file" or "directory"
- `size`: File size in bytes (files only)
- `ctime`: Creation timestamp (ISO format)
- `mtime`: Modification timestamp (ISO format)
- `sha256`: SHA-256 hash of file content (files only)
- `depth`: Directory depth from root

### Functions

- `createSnapshot(options)`: Creates a new snapshot file
- `compareSnapshots(path1, path2)`: Compares two snapshots
- `validateSnapshot(path)`: Validates a snapshot file
- `generateSnapshotName(prefix, extension)`: Generates a timestamped filename

## Snapshot File Format

Snapshots are saved in NDJSON format with the following structure:

- Header line (JSON object with metadata)
- File entry lines (one per file/directory)
- Footer line (status information)

## License

MIT