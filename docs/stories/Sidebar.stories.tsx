import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Sidebar, sidebarAligns, spaces } from "@timhettler/radix-layout";

import { resolvedGap } from "../lib/space";
import { componentAttributeValues } from "../lib/stylesheets";

function nodeIn(root: Element, selector = ".el-sidebar") {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Nothing rendered for "${selector}"`);
  return node;
}

const partsOf = (node: Element) => ({
  side: nodeIn(node, ":scope > .el-sidebar__side").getBoundingClientRect(),
  content: nodeIn(
    node,
    ":scope > .el-sidebar__content",
  ).getBoundingClientRect(),
});

const isRow = (node: Element) => {
  const { side, content } = partsOf(node);
  return Math.abs(side.top - content.top) < 0.5;
};

/** Both parts full width, each on its own line, in DOM order. */
const isStacked = (node: Element) => {
  const width = node.getBoundingClientRect().width;
  const [first, second] = [...node.children].map((child) =>
    child.getBoundingClientRect(),
  );
  return (
    Math.abs(first.width - width) < 0.5 &&
    Math.abs(second.width - width) < 0.5 &&
    second.top >= first.bottom
  );
};

/** A length in px, resolved inside `parent`, where a part reads its knob. */
function resolvedLength(parent: Element, value: string) {
  const probe = document.createElement("div");
  probe.setAttribute(
    "style",
    `position: absolute; visibility: hidden; inline-size: ${value}`,
  );
  parent.append(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px;
}

const gapOf = (node: Element) => parseFloat(getComputedStyle(node).columnGap);

/** Above the browsers' layout units (1/64px, or 1/60px in Firefox). */
const NEAR = 0.1;

/** Under the side's growth at a 999 grow ratio, at any width these stories use. */
const EXACT = 0.02;

const setWidth = (frame: HTMLElement, px: number) => {
  frame.style.inlineSize = `${px}px`;
};

/** A plain box with a visible edge, inside a part so the part's own width is its basis. */
const tile = {
  border: "1px solid currentColor",
  padding: "0.5rem",
} as const;

const knobs = (values: {
  side?: string;
  content?: string;
}): React.CSSProperties =>
  ({
    ...(values.side && { "--el-sidebar-side-width": values.side }),
    ...(values.content && { "--el-sidebar-content-min": values.content }),
  }) as React.CSSProperties;

/** A stand-in image with an intrinsic width and no network request. */
const image = (width: number, height: number) => (
  <img
    alt=""
    width={width}
    height={height}
    style={{ display: "block", background: "currentColor" }}
    src={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"/>`}
  />
);

const prose =
  "Two unequal parts side by side that stack when there isn't room. The pair wraps when the content would be narrower than its share of the row.";

const meta = {
  title: "Layouts/Sidebar",
  component: Sidebar.Root,
  parameters: { layout: "padded" },
  argTypes: {
    // Taken from the library, not restated — a restated list drifts.
    space: { control: "select", options: spaces },
    align: { control: "select", options: sidebarAligns },
  },
} satisfies Meta<typeof Sidebar.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    space: "m",
    children: (
      <>
        <Sidebar.Side>{image(160, 90)}</Sidebar.Side>
        {/* A <p>, so a missing margin reset shows as content pushed down. */}
        <Sidebar.Content asChild>
          <p>{prose}</p>
        </Sidebar.Content>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);

    await expect(node.tagName).toBe("DIV");
    await expect(node.getAttribute("data-space")).toBe("m");
    await expect(node.hasAttribute("data-align")).toBe(false);

    const style = getComputedStyle(node);
    await expect(style.display).toBe("flex");
    await expect(style.flexWrap).toBe("wrap");
    await expect(style.alignItems).toBe("stretch");
    await expect(gapOf(node)).toBeCloseTo(resolvedGap("m"), 1);

    const content = nodeIn(node, ".el-sidebar__content");
    await expect(content.tagName).toBe("P");
    await expect(getComputedStyle(content).marginBlockStart).toBe("0px");

    // The defaults: the side is its content's width, and the content needs half.
    const side = nodeIn(node, ".el-sidebar__side");
    await expect(getComputedStyle(side).flexBasis).toBe("auto");
    await expect(getComputedStyle(content).minInlineSize).toBe("50%");

    const width = node.getBoundingClientRect().width;
    const needed = 2 * (160 + gapOf(node));
    await expect(width >= needed ? isRow(node) : isStacked(node)).toBe(true);
  },
};

/** Every step on the space scale has a rule, and every rule renders its step. */
export const Spacing: Story = {
  args: { space: "m" },
  render: () => (
    <div>
      {spaces.map((step) => (
        <Sidebar.Root key={step} space={step} data-step={step}>
          <Sidebar.Side>
            <div style={tile}>Side</div>
          </Sidebar.Side>
          <Sidebar.Content>
            <div style={tile}>Content</div>
          </Sidebar.Content>
        </Sidebar.Root>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      [...componentAttributeValues("el-sidebar", "data-space")].sort(),
    ).toEqual([...spaces].sort());

    for (const step of spaces) {
      const node = nodeIn(canvasElement, `[data-step="${step}"]`);
      await expect(gapOf(node), `space="${step}"`).toBeCloseTo(
        resolvedGap(step),
        1,
      );
    }
  },
};

const ALIGN_VALUE = {
  start: "flex-start",
  center: "safe center",
  end: "safe flex-end",
  stretch: "stretch",
} as const;

/**
 * Every `align` has a rule. `stretch` makes both parts the taller one's
 * height, and the image inside the side keeps its own; `start` leaves both at
 * their natural height.
 */
export const Alignment: Story = {
  args: { space: "s" },
  render: () => (
    <div style={{ inlineSize: "40rem" }}>
      {sidebarAligns.map((align) => (
        <Sidebar.Root key={align} space="s" align={align} data-demo={align}>
          <Sidebar.Side>{image(80, 40)}</Sidebar.Side>
          <Sidebar.Content>
            <p style={{ ...tile, margin: 0 }}>{prose}</p>
          </Sidebar.Content>
        </Sidebar.Root>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      [...componentAttributeValues("el-sidebar", "data-align")].sort(),
    ).toEqual([...sidebarAligns].sort());

    for (const align of sidebarAligns) {
      const node = nodeIn(canvasElement, `[data-demo="${align}"]`);
      await expect(getComputedStyle(node).alignItems, align).toBe(
        ALIGN_VALUE[align],
      );
    }

    const stretch = nodeIn(canvasElement, '[data-demo="stretch"]');
    const stretched = partsOf(stretch);
    await expect(isRow(stretch)).toBe(true);
    await expect(stretched.side.height).toBeCloseTo(
      stretched.content.height,
      1,
    );
    await expect(stretched.content.height).toBeGreaterThan(40);
    const img = nodeIn(stretch, "img").getBoundingClientRect();
    await expect(img.width).toBe(80);
    await expect(img.height).toBe(40);

    const start = partsOf(nodeIn(canvasElement, '[data-demo="start"]'));
    await expect(start.side.height).toBe(40);
  },
};

const SIDE_REM = 15;

/**
 * The pair holds while the content gets half the row, so it wraps below twice
 * the side plus the gap. Beside the content the side is exactly its width, at
 * the threshold and well above it; stacked, both parts are full width.
 */
export const Threshold: Story = {
  args: { space: "m" },
  render: () => (
    <div data-frame="">
      <Sidebar.Root space="m" style={knobs({ side: `${SIDE_REM}rem` })}>
        <Sidebar.Side>
          <div style={tile}>Filters</div>
        </Sidebar.Side>
        <Sidebar.Content>
          <div style={tile}>Results</div>
        </Sidebar.Content>
      </Sidebar.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const node = nodeIn(frame);
    const side = resolvedLength(node, `${SIDE_REM}rem`);
    const gap = gapOf(node);
    const threshold = 2 * (side + gap);

    for (const width of [threshold + NEAR, 1200]) {
      setWidth(frame, width);
      await expect(isRow(node), `${width}px`).toBe(true);
      const parts = partsOf(node);
      await expect(
        Math.abs(parts.side.width - side),
        `${width}px`,
      ).toBeLessThan(EXACT);
      await expect(parts.content.width).toBeCloseTo(width - side - gap, 1);
    }

    setWidth(frame, threshold - NEAR);
    await expect(isStacked(node)).toBe(true);
  },
};

/**
 * With no side width the side is its content's width: an image's intrinsic
 * width. Stacked, the side fills its line and the image keeps its size.
 */
export const IntrinsicSide: Story = {
  args: { space: "s" },
  render: () => (
    <div data-frame="">
      <Sidebar.Root space="s">
        <Sidebar.Side>{image(160, 90)}</Sidebar.Side>
        <Sidebar.Content>
          <p style={{ margin: 0 }}>{prose}</p>
        </Sidebar.Content>
      </Sidebar.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const node = nodeIn(frame);
    const threshold = 2 * (160 + gapOf(node));

    setWidth(frame, threshold + NEAR);
    await expect(isRow(node)).toBe(true);
    await expect(Math.abs(partsOf(node).side.width - 160)).toBeLessThan(EXACT);

    setWidth(frame, threshold - NEAR);
    await expect(isStacked(node)).toBe(true);
    const img = nodeIn(node, "img").getBoundingClientRect();
    await expect(img.width).toBe(160);
    await expect(img.height).toBe(90);
  },
};

/**
 * Every Layout's search field: the button is the side, at its own width, and
 * the input needs two thirds of the row.
 */
export const SearchField: Story = {
  args: { space: "xs" },
  render: () => (
    <div data-frame="">
      <Sidebar.Root asChild space="xs" style={knobs({ content: "66.666%" })}>
        <form role="search" onSubmit={(event) => event.preventDefault()}>
          <Sidebar.Content asChild>
            <input type="search" aria-label="Search" />
          </Sidebar.Content>
          <Sidebar.Side asChild>
            <button type="submit">Search</button>
          </Sidebar.Side>
        </form>
      </Sidebar.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const node = nodeIn(frame);
    await expect(node.tagName).toBe("FORM");
    await expect(node.getAttribute("role")).toBe("search");

    setWidth(frame, 1000);
    const button = partsOf(node).side.width;
    const threshold = (button + gapOf(node)) / (1 - 0.66666);

    setWidth(frame, threshold + NEAR);
    await expect(isRow(node)).toBe(true);
    // DOM order is reading order: the input first, the button on the right.
    const parts = partsOf(node);
    await expect(parts.side.left).toBeGreaterThan(parts.content.left);
    await expect(Math.abs(parts.side.width - button)).toBeLessThan(EXACT);

    setWidth(frame, threshold - NEAR);
    await expect(isStacked(node)).toBe(true);
    // The side last in the DOM stacks below.
    const stacked = partsOf(node);
    await expect(stacked.side.top).toBeGreaterThan(stacked.content.top);
  },
};

/**
 * A length minimum is a reading width, resolved against the content's own
 * font: `30ch` in the content's larger text.
 */
export const ReadingWidth: Story = {
  args: { space: "s" },
  render: () => (
    <div data-frame="">
      <Sidebar.Root space="s" style={knobs({ side: "10rem", content: "30ch" })}>
        <Sidebar.Side>
          <div style={tile}>Side</div>
        </Sidebar.Side>
        <Sidebar.Content style={{ fontSize: "1.25rem" }}>
          <p style={{ margin: 0 }}>{prose}</p>
        </Sidebar.Content>
      </Sidebar.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const node = nodeIn(frame);
    const content = nodeIn(node, ".el-sidebar__content");
    const measure = resolvedLength(content, "30ch");
    await expect(measure).toBeGreaterThan(resolvedLength(node, "30ch"));

    const threshold = resolvedLength(node, "10rem") + gapOf(node) + measure;

    setWidth(frame, threshold + NEAR);
    await expect(isRow(node)).toBe(true);
    setWidth(frame, threshold - NEAR);
    await expect(isStacked(node)).toBe(true);
  },
};

/**
 * A long word in the content overflows the content and leaves the side its
 * width. A side whose content is wider than its knob grows to that content.
 */
export const Overflow: Story = {
  args: { space: "s" },
  render: () => (
    <div style={{ inlineSize: "30rem" }}>
      <Sidebar.Root
        space="s"
        style={knobs({ side: "8rem" })}
        data-demo="content"
      >
        <Sidebar.Side>
          <div style={tile}>Side</div>
        </Sidebar.Side>
        <Sidebar.Content>
          <div style={tile} data-long="">
            {"Pneumonoultramicroscopicsilicovolcanoconiosis".repeat(2)}
          </div>
        </Sidebar.Content>
      </Sidebar.Root>
      <Sidebar.Root space="s" style={knobs({ side: "4rem" })} data-demo="side">
        <Sidebar.Side>
          <div style={{ inlineSize: "6rem" }} data-wide="" />
        </Sidebar.Side>
        <Sidebar.Content>
          <div style={tile}>Content</div>
        </Sidebar.Content>
      </Sidebar.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const long = nodeIn(canvasElement, '[data-demo="content"]');
    await expect(isRow(long)).toBe(true);
    await expect(
      Math.abs(partsOf(long).side.width - resolvedLength(long, "8rem")),
    ).toBeLessThan(EXACT);
    const word = nodeIn(long, "[data-long]");
    await expect(word.scrollWidth).toBeGreaterThan(word.clientWidth);

    const wide = nodeIn(canvasElement, '[data-demo="side"]');
    await expect(isRow(wide)).toBe(true);
    await expect(partsOf(wide).side.width).toBeCloseTo(
      resolvedLength(wide, "6rem"),
      1,
    );
  },
};

/** One part alone fills the row, so a conditional side leaves no gap. */
export const OnePart: Story = {
  args: { space: "m" },
  render: () => (
    <div style={{ inlineSize: "30rem" }}>
      <Sidebar.Root space="m" data-demo="content">
        <Sidebar.Content>
          <div style={tile}>Content</div>
        </Sidebar.Content>
      </Sidebar.Root>
      <Sidebar.Root space="m" data-demo="side">
        <Sidebar.Side>
          <div style={tile}>Side</div>
        </Sidebar.Side>
      </Sidebar.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const demo of ["content", "side"]) {
      const node = nodeIn(canvasElement, `[data-demo="${demo}"]`);
      await expect(
        node.firstElementChild!.getBoundingClientRect().width,
        demo,
      ).toBeCloseTo(node.getBoundingClientRect().width, 1);
    }
  },
};

/**
 * The knobs are set on the consumer's own classes, injected before every
 * sheet, so they win only because the defaults are layered (ADR 0003 § 1).
 * Either knob works on the root or on the part that reads it, and a nested
 * sidebar keeps its own defaults.
 */
export const ConsumerKnobs: Story = {
  args: { space: "s" },
  render: () => (
    <div data-frame="">
      <Sidebar.Root space="s" className="media">
        <Sidebar.Side>
          <div style={tile}>Side</div>
        </Sidebar.Side>
        <Sidebar.Content className="media-body">
          <Sidebar.Root space="s" data-demo="nested">
            <Sidebar.Side>{image(40, 40)}</Sidebar.Side>
            <Sidebar.Content>
              <div style={tile}>Nested</div>
            </Sidebar.Content>
          </Sidebar.Root>
        </Sidebar.Content>
      </Sidebar.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const override = document.createElement("style");
    override.textContent =
      ".media { --el-sidebar-side-width: 12rem; } .media-body { --el-sidebar-content-min: 60%; }";
    document.head.prepend(override);

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const node = nodeIn(canvasElement, ".media");
      const side = resolvedLength(node, "12rem");
      const threshold = (side + gapOf(node)) / (1 - 0.6);

      setWidth(frame, threshold + NEAR);
      await expect(isRow(node)).toBe(true);
      await expect(Math.abs(partsOf(node).side.width - side)).toBeLessThan(
        EXACT,
      );
      setWidth(frame, threshold - NEAR);
      await expect(isStacked(node)).toBe(true);

      const nested = nodeIn(canvasElement, '[data-demo="nested"]');
      await expect(
        getComputedStyle(nodeIn(nested, ".el-sidebar__side")).flexBasis,
      ).toBe("auto");
      await expect(
        getComputedStyle(nodeIn(nested, ".el-sidebar__content")).minInlineSize,
      ).toBe("50%");
    } finally {
      override.remove();
    }
  },
};

/**
 * `asChild` makes each part your element, merging onto it rather than
 * wrapping it.
 */
export const Semantics: Story = {
  args: { space: "m" },
  render: () => (
    <Sidebar.Root space="m" style={knobs({ side: "12rem" })}>
      <Sidebar.Side asChild>
        <aside className="filters" aria-label="Filters" style={tile}>
          Filters
        </aside>
      </Sidebar.Side>
      <Sidebar.Content asChild>
        <main className="results" style={tile}>
          Results
        </main>
      </Sidebar.Content>
    </Sidebar.Root>
  ),
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);
    const [aside, main] = node.children;

    await expect(aside.tagName).toBe("ASIDE");
    await expect(main.tagName).toBe("MAIN");
    // Slot-first is Radix's order; this pins it, not cx().
    await expect(aside.className).toBe("el-sidebar__side filters");
    await expect(main.className).toBe("el-sidebar__content results");
  },
};
