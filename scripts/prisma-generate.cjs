/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

// Where npm thinks this package lives.
// In some hosting setups, package.json is a symlink; prefer the real path.
const pkgJsonPath = process.env.npm_package_json;
let pkgDir = process.cwd();
if (pkgJsonPath) {
  try {
    pkgDir = path.dirname(fs.realpathSync(pkgJsonPath));
  } catch {
    pkgDir = path.dirname(pkgJsonPath);
  }
}

// INIT_CWD is the directory npm was invoked from. This is useful when npm scripts
// are executed with a different cwd (e.g., deployment environments using --prefix).
const initCwd = process.env.INIT_CWD;

const schemaCandidates = [];
if (initCwd) {
  schemaCandidates.push(path.join(initCwd, "prisma", "schema.prisma"));
  schemaCandidates.push(path.join(initCwd, "schema.prisma"));
}
schemaCandidates.push(path.join(pkgDir, "prisma", "schema.prisma"));
schemaCandidates.push(path.join(pkgDir, "schema.prisma"));
schemaCandidates.push(path.join(process.cwd(), "prisma", "schema.prisma"));
schemaCandidates.push(path.join(process.cwd(), "schema.prisma"));

const schemaPath = schemaCandidates.find(exists);
if (!schemaPath) {
  console.error("Error: Could not find Prisma schema. Checked:");
  for (const p of schemaCandidates) console.error(`- ${p}`);
  process.exit(1);
}

// Prefer the local Prisma CLI binary directly (less process overhead than `npm exec`).
// Disable Prisma's checkpoint/update check. On some shared hosts, it can fail with EAGAIN
// due to tight process limits, even though `prisma generate` itself is fine.
const binName = process.platform === "win32" ? "prisma.cmd" : "prisma";
const prismaBin = path.join(pkgDir, "node_modules", ".bin", binName);

if (!fs.existsSync(prismaBin)) {
  console.error(`Error: Prisma CLI binary not found: ${prismaBin}`);
  console.error("Make sure prisma is installed (as a dependency on production hosts).");
  process.exit(1);
}

const res = spawnSync(prismaBin, ["generate", "--schema", schemaPath], {
  stdio: "inherit",
  cwd: pkgDir,
  env: { ...process.env, CHECKPOINT_DISABLE: "1" },
});
process.exit(res.status ?? 1);
