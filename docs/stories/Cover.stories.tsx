import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Cover, Sidebar, coverMins, spaces } from "@timhettler/radix-layout";

import { resolvedGap } from "../lib/space";
import { componentAttributeValues } from "../lib/stylesheets";

function nodeIn(root: Element, selector = ".el-cover") {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Nothing rendered for "${selector}"`);
  return node;
}

const rectOf = (root: Element, selector: string) =>
  nodeIn(root, selector).getBoundingClientRect();

const gapOf = (node: Element) => parseFloat(getComputedStyle(node).rowGap);

/** A length in px, resolved inside `parent`. */
function resolvedLength(parent: Element, value: string) {
  const probe = document.createElement("div");
  probe.setAttribute(
    "style",
    `position: absolute; visibility: hidden; block-size: ${value}`,
  );
  parent.append(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
}

/** Prepends `css` before every sheet, so it wins only where the defaults are layered (ADR 0003 § 1). */
function prepend(css: string) {
  const override = document.createElement("style");
  override.textContent = css;
  document.head.prepend(override);
  return () => override.remove();
}

/** Above the browsers' layout units (1/64px, or 1/60px in Firefox). */
const NEAR = 0.5;

const knob = (value: string) =>
  ({ "--el-cover-min": value }) as React.CSSProperties;

/** A box of a set height, its border included, with a visible edge. */
const tile = (blockSize: string): React.CSSProperties => ({
  blockSize,
  boxSizing: "border-box",
  border: "1px solid currentColor",
});

/** Header, centred heading and footer, each with UA block margins for the reset to zero. */
const parts = (
  <>
    <p data-part="header">Logo and navigation</p>
    <Cover.Centered asChild>
      <h1 data-part="centered">Welcome</h1>
    </Cover.Centered>
    <p data-part="footer">Scroll for more</p>
  </>
);

const meta = {
  title: "Layouts/Cover",
  component: Cover.Root,
  parameters: { layout: "fullscreen" },
  argTypes: {
    // Taken from the library, not restated — a restated list drifts.
    space: { control: "select", options: spaces },
    min: { control: "select", options: coverMins },
  },
} satisfies Meta<typeof Cover.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The viewport's height, with the heading in the middle of what the header and footer leave. */
export const Default: Story = {
  args: { space: "m", min: "screen", children: parts },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);

    await expect(node.tagName).toBe("DIV");
    await expect(node.getAttribute("data-space")).toBe("m");
    await expect(node.getAttribute("data-min")).toBe("screen");

    const style = getComputedStyle(node);
    await expect(style.display).toBe("flex");
    await expect(style.flexDirection).toBe("column");
    await expect(style.flexWrap).toBe("nowrap");
    await expect(style.alignItems).toBe("stretch");
    await expect(gapOf(node)).toBeCloseTo(resolvedGap("m"), 1);

    // svh is the viewport's height in a frame with no browser chrome.
    await expect(node.getBoundingClientRect().height).toBeCloseTo(
      window.innerHeight,
      0,
    );

    for (const part of ["header", "footer"]) {
      const { marginBlockStart, marginBlockEnd } = getComputedStyle(
        nodeIn(node, `[data-part="${part}"]`),
      );
      await expect([marginBlockStart, marginBlockEnd], part).toEqual([
        "0px",
        "0px",
      ]);
    }

    const header = rectOf(node, '[data-part="header"]');
    const centered = rectOf(node, '[data-part="centered"]');
    const footer = rectOf(node, '[data-part="footer"]');
    await expect(centered.top - header.bottom).toBeGreaterThan(gapOf(node));
    await expect(
      Math.abs(centered.top - header.bottom - (footer.top - centered.bottom)),
    ).toBeLessThan(NEAR);
    await expect(header.top).toBeCloseTo(node.getBoundingClientRect().top, 1);
    await expect(footer.bottom).toBeCloseTo(
      node.getBoundingClientRect().bottom,
      1,
    );
  },
};

/** Alone, the centred child is in the middle of the cover. */
export const CenteredAlone: Story = {
  args: {
    space: "m",
    min: "screen",
    children: (
      <Cover.Centered asChild>
        <h1 data-part="centered">Welcome</h1>
      </Cover.Centered>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);
    const root = node.getBoundingClientRect();
    const centered = rectOf(node, '[data-part="centered"]');

    await expect(
      Math.abs(
        (centered.top + centered.bottom) / 2 - (root.top + root.bottom) / 2,
      ),
    ).toBeLessThan(NEAR);
  },
};

/**
 * Content taller than the minimum grows the cover, with the header and footer
 * at its edges and the gap between the parts.
 */
export const TallContent: Story = {
  args: {
    space: "l",
    min: "screen",
    children: (
      <>
        <div data-part="header" style={tile("4rem")} />
        <Cover.Centered data-part="centered" style={tile("150vh")} />
        <div data-part="footer" style={tile("4rem")} />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);
    const root = node.getBoundingClientRect();
    const header = rectOf(node, '[data-part="header"]');
    const centered = rectOf(node, '[data-part="centered"]');
    const footer = rectOf(node, '[data-part="footer"]');
    const gap = resolvedGap("l");

    await expect(root.height).toBeGreaterThan(window.innerHeight);
    await expect(header.top).toBeCloseTo(root.top, 1);
    await expect(centered.top - header.bottom).toBeCloseTo(gap, 1);
    await expect(footer.top - centered.bottom).toBeCloseTo(gap, 1);
    await expect(footer.bottom).toBeCloseTo(root.bottom, 1);
  },
};

/**
 * Omitted, `min` leaves the cover its content's height. `screen` is the
 * viewport's, and `--el-cover-min` from a class of your own beats either.
 */
export const MinimumHeight: Story = {
  args: { space: "m" },
  render: () => (
    <>
      <Cover.Root space="m" data-case="none">
        <div style={tile("2rem")} />
        <Cover.Centered style={tile("3rem")} />
      </Cover.Root>
      <Cover.Root space="m" min="screen" data-case="screen">
        <Cover.Centered style={tile("3rem")} />
      </Cover.Root>
      <Cover.Root space="m" data-case="knob" style={knob("20rem")}>
        {parts}
      </Cover.Root>
      <Cover.Root
        space="m"
        min="screen"
        data-case="class"
        className="story-cover"
      >
        <Cover.Centered style={tile("3rem")} />
      </Cover.Root>
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      [...componentAttributeValues("el-cover", "data-min")].sort(),
    ).toEqual([...coverMins].sort());

    const none = nodeIn(canvasElement, '[data-case="none"]');
    await expect(none.hasAttribute("data-min")).toBe(false);
    await expect(none.getBoundingClientRect().height).toBeCloseTo(
      resolvedLength(none, "5rem") + resolvedGap("m", none),
      1,
    );

    const screen = nodeIn(canvasElement, '[data-case="screen"]');
    await expect(screen.getAttribute("data-min")).toBe("screen");
    // svh is the viewport's height in a frame with no browser chrome.
    await expect(screen.getBoundingClientRect().height).toBeCloseTo(
      window.innerHeight,
      0,
    );

    const twenty = nodeIn(canvasElement, '[data-case="knob"]');
    await expect(twenty.getBoundingClientRect().height).toBeCloseTo(
      resolvedLength(twenty, "20rem"),
      1,
    );

    // A consumer's class wins over the layered prop whatever the load order.
    const restore = prepend(".story-cover { --el-cover-min: 12rem; }");
    try {
      const own = nodeIn(canvasElement, '[data-case="class"]');
      await expect(own.getBoundingClientRect().height).toBeCloseTo(
        resolvedLength(own, "12rem"),
        1,
      );
    } finally {
      restore();
    }
  },
};

/** A nested cover keeps its own minimum when the outer one sets the knob. */
export const Nested: Story = {
  args: { space: "m" },
  render: () => (
    <Cover.Root space="m" style={knob("30rem")}>
      <Cover.Centered asChild>
        <Cover.Root space="m" data-cover="inner">
          <Cover.Centered style={tile("3rem")} />
        </Cover.Root>
      </Cover.Centered>
    </Cover.Root>
  ),
  play: async ({ canvasElement }) => {
    const inner = nodeIn(canvasElement, '[data-cover="inner"]');
    await expect(inner.getBoundingClientRect().height).toBeCloseTo(
      resolvedLength(inner, "3rem"),
      1,
    );
  },
};

/** A fill takes the space between the header and footer, so the footer sits at the bottom. */
export const Fill: Story = {
  args: {
    space: "m",
    min: "screen",
    children: (
      <>
        <div data-part="header" style={tile("3rem")} />
        <Cover.Fill data-part="fill">
          <div style={tile("4rem")} />
        </Cover.Fill>
        <div data-part="footer" style={tile("3rem")} />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);
    const root = node.getBoundingClientRect();
    const header = rectOf(node, '[data-part="header"]');
    const fill = rectOf(node, '[data-part="fill"]');
    const footer = rectOf(node, '[data-part="footer"]');
    const gap = resolvedGap("m");

    await expect(root.height).toBeCloseTo(window.innerHeight, 0);
    await expect(fill.top - header.bottom).toBeCloseTo(gap, 1);
    await expect(footer.top - fill.bottom).toBeCloseTo(gap, 1);
    await expect(footer.bottom).toBeCloseTo(root.bottom, 1);
  },
};

/**
 * In a cover of fixed height, a fill with more content than fits shrinks
 * rather than pushing the footer out of the box.
 */
export const FillFixedHeight: Story = {
  args: {
    space: "m",
    style: { blockSize: "20rem" },
    children: (
      <>
        <div data-part="header" style={tile("3rem")} />
        <Cover.Fill data-part="fill">
          <div style={tile("60rem")} />
        </Cover.Fill>
        <div data-part="footer" style={tile("3rem")} />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);
    const root = node.getBoundingClientRect();
    const header = rectOf(node, '[data-part="header"]');
    const fill = rectOf(node, '[data-part="fill"]');
    const footer = rectOf(node, '[data-part="footer"]');
    const gap = resolvedGap("m");

    await expect(root.height).toBeCloseTo(resolvedLength(node, "20rem"), 1);
    await expect(footer.bottom).toBeCloseTo(root.bottom, 1);
    await expect(fill.top - header.bottom).toBeCloseTo(gap, 1);
    await expect(footer.top - fill.bottom).toBeCloseTo(gap, 1);
  },
};

/**
 * A page shell: the fill is a `Sidebar`, so both columns run the full height
 * between the header and footer.
 */
export const PageShell: Story = {
  args: {
    space: "m",
    min: "screen",
    children: (
      <>
        <div data-part="header" style={tile("3rem")} />
        <Cover.Fill asChild>
          <Sidebar.Root space="m" data-part="fill">
            <Sidebar.Side data-part="side">
              <div style={tile("2rem")}>Navigation</div>
            </Sidebar.Side>
            <Sidebar.Content data-part="content">
              <div style={tile("4rem")}>Content</div>
            </Sidebar.Content>
          </Sidebar.Root>
        </Cover.Fill>
        <div data-part="footer" style={tile("3rem")} />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);
    const fill = rectOf(node, '[data-part="fill"]');
    const footer = rectOf(node, '[data-part="footer"]');

    await expect(footer.bottom).toBeCloseTo(
      node.getBoundingClientRect().bottom,
      1,
    );
    for (const part of ["side", "content"]) {
      await expect(
        rectOf(node, `[data-part="${part}"]`).height,
        part,
      ).toBeCloseTo(fill.height, 1);
    }
  },
};

/**
 * A consumer's block margin on the centred child, at one class and loaded
 * last, doesn't beat the auto margins.
 */
export const ConsumerMargin: Story = {
  args: { space: "m", min: "screen", children: parts },
  play: async ({ canvasElement }) => {
    const override = document.createElement("style");
    override.textContent = ".el-cover__centered { margin-block: 3rem; }";
    document.head.append(override);
    try {
      const node = nodeIn(canvasElement);
      const header = rectOf(node, '[data-part="header"]');
      const centered = rectOf(node, '[data-part="centered"]');
      const footer = rectOf(node, '[data-part="footer"]');
      const pinned = resolvedLength(node, "3rem") + gapOf(node);
      await expect(centered.top - header.bottom).toBeGreaterThan(pinned + 1);
      await expect(
        Math.abs(centered.top - header.bottom - (footer.top - centered.bottom)),
      ).toBeLessThan(NEAR);
    } finally {
      override.remove();
    }
  },
};

/** Every step has a rule. */
export const Spacing: Story = {
  args: { space: "m" },
  render: () => (
    <div>
      {spaces.map((step) => (
        <Cover.Root key={step} space={step} data-step={step}>
          <div style={tile("1rem")} />
          <Cover.Centered style={tile("1rem")} />
        </Cover.Root>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      [...componentAttributeValues("el-cover", "data-space")].sort(),
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
