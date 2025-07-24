# Directory Scanner & Snapshot Tool

A lightweight Node.js library for scanning directories and creating snapshot files with metadata including file hashes, perfect for integrity checking, backups, or change detection.

## Features

- Recursively scan directories with configurable depth
- Exclude specific paths or patterns
- Generate SHA-256 hashes for file content verification
- Capture file metadata (size, timestamps)
- Create timestamped snapshot files
- Machine-specific identification support
- Output in newline-delimited JSON (NDJSON) format

## Installation

```bash
npm install https://github.com/supercat1337/dir-snapshot-tool
```

## Usage

### Basic Example

```javascript
import { generateSnapshotName, scanToFile } from 'dir-snapshot-tool';

const outputFile = './snapshots/' + generateSnapshotName();

scanToFile({
  outputFile,
  dirPath: './project-folder',
  excludePaths: [
    '/project-folder/node_modules',
    '/project-folder/.git',
    /\.tmp$/ // exclude all .tmp files using regex
  ],
  machineId: 'server-01'
})
.then(() => console.log('Snapshot created successfully'))
.catch(console.error);
```

## API Reference

### `generateSnapshotName(prefix = "snapshot", extension = "ndjson")`

Generates a timestamped filename.

- **prefix**: String to prepend to the filename (default: "snapshot")
- **extension**: File extension (default: "ndjson")

**Returns**: `string` - Formatted filename (e.g., "snapshot.2023-11-15.14-30-45.ndjson")

### `scanToFile(options)`

Scans a directory and writes snapshot to file.

**Options object:**

- **outputFile**: `string` (required) - Path to output file
- **dirPath**: `string` (required) - Directory to scan
- **excludePaths**: `Array<string|RegExp>` - Paths/patterns to exclude
- **maxDepth**: `number` - Maximum recursion depth (default: Infinity)
- **machineId**: `string` - Identifier for the scanning machine (default: "unknown")
- **metadata**: `Object` - Additional metadata to include in snapshot header

**Returns**: `Promise<void>`

## Snapshot File Format

The snapshot file uses NDJSON format with:

- A header line containing metadata
- Subsequent lines for each file/directory entry

Example entry:

```json
{"path":"/absolute/path/to/file.txt","type":"file","size":1024,"ctime":"2023-11-15T14:30:45.000Z","mtime":"2023-11-15T14:30:45.000Z","sha256":"a1b2c3...","depth":2}
```

## Use Cases

- Verify directory integrity between systems
- Detect unauthorized file changes
- Create lightweight backups
- Monitor directory structure over time
- Compare development environments

