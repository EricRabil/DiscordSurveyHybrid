import * as fs from "fs-extra";
import * as path from "path";

export async function loadFile(filePath: string, loader: (file: any) => Promise<void>): Promise<void> {
    if (!filePath.endsWith(".js")) {
        return;
    }
    let rawFile: any = require(filePath);
    if (Array.isArray(rawFile)) {
        const recursivePromises: Array<Promise<void>> = [];
        for (const rawRoute of rawFile) {
            recursivePromises.push(loader(rawRoute));
        }
        await Promise.all(recursivePromises);
        return;
    } else {
        await loader(rawFile);
        return;
    }
}

export async function loadDirectory(directory: string, loader: (file: any) => Promise<void>): Promise<void> {
    const contents = await fs.readdir(directory);
    const recursivePromises: Array<Promise<void>> = [];
    for (const content of contents) {
        const itemPath = path.join(directory, content);
        let isFile: boolean = false;
        try {
            const itemStats = await fs.stat(itemPath);
            if (!itemStats.isFile()) {
                recursivePromises.push(loadDirectory(itemPath, loader));
                continue;
            }
            recursivePromises.push(loadFile(itemPath, loader));
        } catch (e) {
            continue;
        }
    }
    await Promise.all(recursivePromises);
}