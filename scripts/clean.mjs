import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptsDirectory);
const distDirectory = join(projectRoot, "dist");

await rm(distDirectory, {
  recursive: true,
  force: true
});
