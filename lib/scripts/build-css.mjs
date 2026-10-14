// Compiles `src/scss` into the stylesheets `package.json` exports.
//
// Runs after `vite build`, which empties `dist/` first. One file per entry, for
// selective loading, plus `styles.css` holding every entry. Each file opens with
// the same `@layer el.defaults;` statement, so the aggregate repeats it; that is
// harmless, since the first one the browser sees fixes the order.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { compileAsync } from "sass-embedded";

const root = path.resolve(import.meta.dirname, "..");
const ENTRIES = ["defaults", "stack", "cluster"];

await mkdir(path.join(root, "dist"), { recursive: true });

const compiled = [];
for (const entry of ENTRIES) {
  const { css } = await compileAsync(
    path.join(root, "src/scss", `${entry}.scss`),
    { style: "expanded" },
  );
  await writeFile(path.join(root, "dist", `${entry}.css`), `${css}\n`);
  compiled.push(css);
}

await writeFile(
  path.join(root, "dist/styles.css"),
  `${compiled.join("\n\n")}\n`,
);
