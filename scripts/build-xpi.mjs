import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptsDirectory);
const distDirectory = join(projectRoot, "dist");
const manifestPath = join(projectRoot, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const packageName = "forward-archive-actions";
const artifactName = `${packageName}-${manifest.version}.xpi`;
const artifactPath = join(distDirectory, artifactName);

await mkdir(distDirectory, { recursive: true });

try {
  execFileSync(
    "zip",
    [
      "-r",
      artifactPath,
      "manifest.json",
      "src"
    ],
    {
      cwd: projectRoot,
      stdio: "inherit"
    }
  );
} catch (error) {
  throw new Error(
    "Failed to build the XPI. Ensure the `zip` command is available on this system."
  );
}

process.stdout.write(`${artifactPath}\n`);
