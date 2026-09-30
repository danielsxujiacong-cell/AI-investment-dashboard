import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localEnvPath = resolve(projectRoot, ".env.local");
const workerEnvPath = resolve(projectRoot, "api-proxy", ".dev.vars");
const wranglerPath = resolve(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");

function readSecretValues(contents) {
  const values = new Map();
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(FINNHUB_API_KEY|MASSIVE_API_KEY|AI_BASE_URL|AI_API_KEY|AI_MODEL)\s*=\s*(.*?)\s*$/);
    if (!match) continue;

    let value = match[2];
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

let envContents;
try {
  envContents = await readFile(localEnvPath, "utf8");
} catch {
  console.error("Create .env.local and add FINNHUB_API_KEY before starting the API proxy.");
  process.exit(1);
}

const secrets = readSecretValues(envContents);
if (secrets.size === 0) {
  console.error("Add at least one API key to .env.local before starting the API proxy.");
  process.exit(1);
}

const workerEnv = ["FINNHUB_API_KEY", "MASSIVE_API_KEY", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL"]
  .filter((name) => secrets.has(name))
  .map((name) => name + "=" + JSON.stringify(secrets.get(name)))
  .join("\n");
await writeFile(workerEnvPath, workerEnv + "\n", { encoding: "utf8" });

const child = spawn(
  process.execPath,
  [wranglerPath, "dev", "--config", "api-proxy/wrangler.jsonc", "--ip", "127.0.0.1", "--port", "8787"],
  { cwd: projectRoot, stdio: "inherit" },
);

child.on("error", () => {
  console.error("Could not start Wrangler. Install project dependencies and retry.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
