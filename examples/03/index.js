// @ts-check

import fs from "fs";
import path from "path";
import {
    createSnapshot,
    compareSnapshots,
    generateSnapshotName,
} from "../../dist/dir_snapshot.esm.js";

const __dirname = import.meta.dirname;

// Утилита для создания директории с родительскими папками
const mkdirSyncRecursive = (dirPath) => {
    fs.mkdirSync(dirPath, { recursive: true });
};

// Утилита для создания файла с содержимым
const createFileWithContent = (filePath, content) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        mkdirSyncRecursive(dir);
    }
    fs.writeFileSync(filePath, content);
};

// 1. Создаем тестовую структуру
const testDir = path.join(__dirname, "test-structure");
if (fs.existsSync(testDir)) {
    // Удаляем если уже существует
    fs.rmSync(testDir, { recursive: true, force: true });
}

// Создаем структуру папок и файлов
mkdirSyncRecursive(testDir);

// Файлы первого уровня
createFileWithContent(path.join(testDir, "file1.txt"), "Initial content 1");
createFileWithContent(path.join(testDir, "file2.txt"), "Initial content 2");

// Подпапка с файлами
mkdirSyncRecursive(path.join(testDir, "subfolder"));

createFileWithContent(
    path.join(testDir, "subfolder", "subfile1.txt"),
    "Sub content 1"
);
createFileWithContent(
    path.join(testDir, "subfolder", "subfile2.txt"),
    "Sub content 2"
);

// Вложенная подпапка
mkdirSyncRecursive(path.join(testDir, "subfolder", "nested"));
createFileWithContent(
    path.join(testDir, "subfolder", "nested", "deepfile.txt"),
    "Deep content"
);

mkdirSyncRecursive(path.join(testDir, "subfolder2"));

console.log("Initial structure created");

// 2. Делаем первый снапшот
const snapshot1Path = __dirname + "/" + generateSnapshotName("snapshot1");
console.log(`Creating first snapshot at: ${snapshot1Path}`);

await createSnapshot({
    outputFile: snapshot1Path,
    dirPath: testDir,
    excludePaths: [".git", /\.DS_Store/],
});

console.log("First snapshot created");

// 3. Вносим изменения в структуру
console.log("Making changes to the structure...");

// Изменяем содержимое файла
fs.writeFileSync(path.join(testDir, "file1.txt"), "Modified content 1");

// Меняем дату модификации
fs.utimesSync(path.join(testDir, "subfolder2"), new Date(Date.now() - 1000), new Date(Date.now()));

// Удаляем файл
fs.unlinkSync(path.join(testDir, "file2.txt"));

//*
// Переименовываем подпапку
fs.renameSync(
    path.join(testDir, "subfolder"),
    path.join(testDir, "renamed-folder")
);
//*/

// Создаем новую подпапку
mkdirSyncRecursive(path.join(testDir, "new-folder"));
createFileWithContent(
    path.join(testDir, "new-folder", "newfile.txt"),
    "Brand new content"
);

console.log("Changes applied");

// 4. Делаем второй снапшот
const snapshot2Path = __dirname + "/" + generateSnapshotName("snapshot2");
console.log(`Creating second snapshot at: ${snapshot2Path}`);

await createSnapshot({
    outputFile: snapshot2Path,
    dirPath: testDir,
    excludePaths: [".git", /\.DS_Store/],
});

console.log("Second snapshot created");

// 5. Сравниваем снапшоты
console.log("Comparing snapshots...");
const differences = await compareSnapshots(snapshot1Path, snapshot2Path);

console.log("\nComparison results:");
console.log("Added files:", differences.added);
console.log("Removed files:", differences.deleted);
console.log("Modified files by date:", differences.modifiedDate);
console.log("Modified files by content:", differences.modifiedContent);

// Удаляем тестовую структуру (опционально)
// fs.rmSync(testDir, { recursive: true, force: true });
