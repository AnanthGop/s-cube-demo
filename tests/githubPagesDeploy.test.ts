import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
};

const readText = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

runTest("Vite base path matches the GitHub Pages repository path", () => {
  const viteConfig = readText("../vite.config.ts");
  assert.match(viteConfig, /base:\s*"\/s-cube-demo\/"/);
});

runTest("GitHub Pages workflow builds and uploads the Vite dist folder", () => {
  const workflow = readText("../.github/workflows/deploy-pages.yml");
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /path:\s*["']?\.\/dist["']?/);
});
