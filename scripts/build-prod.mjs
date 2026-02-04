import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const devVars = path.join(root, ".dev.vars");
const backup = path.join(root, ".dev.vars.local");

const hasDevVars = existsSync(devVars);
if (hasDevVars && existsSync(backup)) {
  console.error(".dev.vars.local already exists; refusing to overwrite.");
  process.exit(1);
}

try {
  if (hasDevVars) {
    renameSync(devVars, backup);
  }

  const result = spawnSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
} finally {
  if (hasDevVars && existsSync(backup) && !existsSync(devVars)) {
    renameSync(backup, devVars);
  }
}
