// Compiles src/scss into dist/ after vite build empties it, one file per entry,
// and publishes the sources to dist/scss for a project configuring its own scale.
import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { compileAsync } from "sass-embedded";

const root = path.resolve(import.meta.dirname, "..");
const ENTRIES = [
  "defaults",
  "stack",
  "cluster",
  "switcher",
  "sidebar",
  "center",
  "bleed",
  "styles",
];

await mkdir(path.join(root, "dist"), { recursive: true });

for (const entry of ENTRIES) {
  const { css } = await compileAsync(
    path.join(root, "src/scss", `${entry}.scss`),
    { style: "expanded" },
  );
  await writeFile(path.join(root, "dist", `${entry}.css`), `${css}\n`);
}

await cp(path.join(root, "src/scss"), path.join(root, "dist/scss"), {
  recursive: true,
});
