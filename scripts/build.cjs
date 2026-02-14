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

const pkgJsonPath = process.env.npm_package_json;
let pkgDir = process.cwd();
if (pkgJsonPath) {
  try {
    pkgDir = path.dirname(fs.realpathSync(pkgJsonPath));
  } catch {
    pkgDir = path.dirname(pkgJsonPath);
  }
}

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

const binExt = process.platform === "win32" ? ".cmd" : "";
const prismaBin = path.join(pkgDir, "node_modules", ".bin", `prisma${binExt}`);
const postcssBin = path.join(pkgDir, "node_modules", ".bin", `postcss${binExt}`);

if (!fs.existsSync(prismaBin)) {
  console.error(`Error: Prisma CLI binary not found: ${prismaBin}`);
  process.exit(1);
}
if (!fs.existsSync(postcssBin)) {
  console.error(`Error: postcss binary not found: ${postcssBin}`);
  console.error("Make sure postcss-cli is installed (as a dependency on production hosts).");
  process.exit(1);
}

const cssInput = path.join(pkgDir, "src", "styles.css");
const cssOutput = path.join(pkgDir, "public", "styles.css");
if (!exists(cssInput)) {
  console.error(`Error: missing CSS entrypoint: ${cssInput}`);
  process.exit(1);
}

// Run Prisma generate first.
let res = spawnSync(prismaBin, ["generate", "--schema", schemaPath], {
  stdio: "inherit",
  cwd: pkgDir,
  env: { ...process.env, CHECKPOINT_DISABLE: "1" },
});
if ((res.status ?? 1) !== 0) process.exit(res.status ?? 1);

// Then build CSS. See scripts/build-css.cjs for rationale.
res = spawnSync(postcssBin, [cssInput, "-o", cssOutput], {
  stdio: "inherit",
  cwd: pkgDir,
  env: { ...process.env, RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS || "1" },
});
process.exit(res.status ?? 1);

