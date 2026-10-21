// Fails when a line that starts with `|` doesn't render as a table row. A row cut off from its table
// has no delimiter row above it, so GitHub prints the pipes as text while the source and the diff
// both look right.
//
// The rules follow what GitHub renders, which differs from the GFM spec's prose: a table may
// interrupt a paragraph, for one. Re-measure before changing a rule:
//
//   jq -Rs '{text: ., mode: "gfm"}' case.md | gh api --method POST /markdown --input -

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..");

/** Only `|`-leading lines: GFM also takes a row without outer pipes, but prose is full of pipes. */
const TABLE_ROW = /^\|/;

const FENCE = /^ {0,3}(?<marker>`{3,}|~{3,})(?<info>.*)$/;
const ATX_HEADING = /^ {0,3}#{1,6}(?: |\t|$)/;
/** A thematic break, or the `---` / `===` underline of a setext heading. */
const BREAK_OR_UNDERLINE =
  /^ {0,3}(?:(?:-[ \t]*){3,}|(?:=[ \t]*)+|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const LIST_MARKER = /^ {0,3}(?:[-+*]|\d{1,9}[.)])(?: |\t|$)/;
const DELIMITER_CELL = /^[ \t]*:?-+:?[ \t]*$/;
const INDENTED = /^(?: {4}|\t)/;

// GFM parses no markdown inside an HTML block, so a `|` row there is text. Type 6 is the block tag
// names below, whatever follows on the line; type 7 is one complete tag alone on a line. Both run to
// the next blank line.
const HTML_BLOCK_TAG =
  /^ {0,3}<\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:[ \t/>]|$)/i;
const HTML_LONE_TAG =
  /^ {0,3}<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*?)?\/?>[ \t]*$/;
const COMMENT_BLOCK = /^ {0,3}<!--/;

function unquote(line: string): { depth: number; body: string } {
  const markers = /^(?:[ \t]{0,3}>[ \t]?)+/.exec(line)?.[0] ?? "";
  return {
    depth: (markers.match(/>/g) ?? []).length,
    body: line.slice(markers.length),
  };
}

/**
 * A row's cells: split on unescaped `|`, then drop the empty ends the outer pipes leave. This reads
 * `\\|` as an escaped pipe where the spec reads an escaped backslash. Leave it: GitHub renders no
 * table for that shape either, and counting by parity would pass a row it prints as text.
 */
function cells(row: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (let index = 0; index < row.length; index += 1) {
    if (row[index] === "\\" && row[index + 1] === "|") {
      current += "|";
      index += 1;
    } else if (row[index] === "|") {
      parts.push(current);
      current = "";
    } else {
      current += row[index];
    }
  }
  parts.push(current);
  if (parts.length > 1 && parts[0] === "") parts.shift();
  if (parts.length > 1 && parts.at(-1) === "") parts.pop();
  return parts;
}

const isDelimiterRow = (row: string[]) =>
  row.every((cell) => DELIMITER_CELL.test(cell));

type Violation = { file: string; line: number; text: string; reason: string };

/** Whether a row renders depends on what came before it, so the state carried between lines is the check. */
function scan(file: string, source: string): Violation[] {
  const violations: Violation[] = [];
  const lines = source.split("\n");

  let fence: string | null = null;
  /** The block-quote depth the fence opened at; only a closer there closes it. */
  let fenceDepth = 0;
  let inComment = false;
  let inHtmlBlock = false;
  let inTable = false;
  let quoteDepth = 0;
  /** Whether a list is open, which tells four spaces of code from four of content. */
  let inList = false;

  const report = (index: number, text: string, reason: string) =>
    violations.push({ file, line: index + 1, text, reason });

  for (const [index, line] of lines.entries()) {
    const { depth, body } = unquote(line);
    const content = body.trim();
    const fenceMatch = FENCE.exec(body);

    // A fence's contents render verbatim and must move no other state.
    if (fence !== null) {
      const closes =
        fenceMatch !== null &&
        depth === fenceDepth &&
        fenceMatch.groups!.marker[0] === fence[0] &&
        fenceMatch.groups!.marker.length >= fence.length &&
        fenceMatch.groups!.info.trim() === "";
      if (closes) fence = null;
      continue;
    }

    // Found by index, not at line start: `Text <!--` opens a comment too.
    if (inComment) {
      if (body.includes("-->")) inComment = false;
      continue;
    }
    const commentOpen = body.indexOf("<!--");
    if (commentOpen !== -1 && !body.slice(commentOpen).includes("-->")) {
      inComment = true;
      inTable = false;
      continue;
    }

    if (inHtmlBlock) {
      if (content === "") {
        inHtmlBlock = false;
        continue;
      }
      if (TABLE_ROW.test(content)) {
        report(
          index,
          content,
          "sits inside a raw HTML block, where GFM parses no markdown. Put a blank line between " +
            "the opening tag and the table",
        );
      }
      continue;
    }

    const marker = LIST_MARKER.exec(body)?.[0] ?? "";
    const htmlOpen = HTML_BLOCK_TAG.test(body) || HTML_LONE_TAG.test(body);
    // A comment alone on its line is an HTML block, so it ends a table; one mid-sentence is inline.
    const commentBlock = COMMENT_BLOCK.test(body);

    if (
      content === "" ||
      depth !== quoteDepth ||
      fenceMatch !== null ||
      ATX_HEADING.test(body) ||
      BREAK_OR_UNDERLINE.test(body) ||
      marker !== "" ||
      commentBlock ||
      htmlOpen
    ) {
      inTable = false;
    }

    quoteDepth = depth;
    if (marker !== "") inList = true;
    else if (content !== "" && !INDENTED.test(body)) inList = false;

    if (fenceMatch !== null) {
      fence = fenceMatch.groups!.marker;
      fenceDepth = depth;
      continue;
    }
    if (htmlOpen) {
      inHtmlBlock = true;
      continue;
    }

    // `- | A | B |` can open a table inside the item, read from the column its content starts on.
    const row =
      marker === ""
        ? body
        : " ".repeat(marker.length) + body.slice(marker.length);

    // Four columns in outside a list is an indented code block.
    if (!inList && INDENTED.test(row)) {
      inTable = false;
      continue;
    }

    const rowContent = row.trim();
    if (!TABLE_ROW.test(rowContent) || inTable) continue;

    const header = cells(rowContent);
    const below =
      lines[index + 1] === undefined ? null : unquote(lines[index + 1]);

    // The delimiter row must sit in the same block. A bare `---` makes a setext heading, a list
    // marker opens an item, and four columns outside a list is code; each would open a false table.
    const belowMarker =
      below === null ? "" : (LIST_MARKER.exec(below.body)?.[0] ?? "");
    const delimiter =
      below === null ||
      below.depth !== depth ||
      belowMarker !== "" ||
      (!inList && INDENTED.test(below.body)) ||
      !below.body.includes("|")
        ? null
        : cells(below.body.trim());

    if (delimiter === null || !isDelimiterRow(delimiter)) {
      report(
        index,
        rowContent,
        "has no delimiter row (`| --- | --- |`) directly below it, so GFM renders the pipes as " +
          "text. Move it back into its table, or give it a delimiter row",
      );
      continue;
    }

    if (delimiter.length !== header.length) {
      report(
        index,
        rowContent,
        `has ${header.length} cell(s) and its delimiter row has ${delimiter.length}, so GFM ` +
          "renders the whole table as text",
      );
      continue;
    }

    inTable = true;
  }

  return violations;
}

// `--others` too: a rule reading only the index passes on a new doc until after it is committed.
const listed = execFileSync(
  "git",
  [
    "ls-files",
    "-z",
    "--cached",
    "--others",
    "--exclude-standard",
    "--",
    "*.md",
    "*.md.template",
  ],
  { cwd: REPO_ROOT, encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);

// A conflicted path is listed once per stage, and a deleted one has nothing to read.
const files = [...new Set(listed)]
  .sort()
  .filter((file) => existsSync(join(REPO_ROOT, file)));

if (files.length === 0) {
  console.error(
    "check:markdown: git listed no markdown files, so a pass would mean nothing.",
  );
  process.exit(1);
}

const violations = files.flatMap((file) =>
  scan(file, readFileSync(join(REPO_ROOT, file), "utf8")),
);

if (violations.length > 0) {
  console.error(
    `${violations.length} line(s) render as pipe text rather than table rows:\n`,
  );
  for (const { file, line, text, reason } of violations) {
    console.error(`  ${file}:${line}  ${reason}.`);
    console.error(`    ${text.length > 96 ? `${text.slice(0, 96)}…` : text}\n`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `check:markdown: every table row in ${files.length} markdown files renders.`,
  );
}
