import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Cover, spaces } from "@timhettler/radix-layout";

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
  },
} satisfies Meta<typeof Cover.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The viewport's height, with the heading in the middle of what the header and footer leave. */
export const Default: Story = {
  args: { space: "m", children: parts },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);

    await expect(node.tagName).toBe("DIV");
    await expect(node.getAttribute("data-space")).toBe("m");

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
 * Content taller than the minimum grows the cover. The auto margins give way
 * to the gap, so nothing is pushed above the top.
 */
export const TallContent: Story = {
  args: {
    space: "l",
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

/** `--el-cover-min` sets the minimum; at `0` the cover is its content's height. */
export const MinimumHeight: Story = {
  args: { space: "m" },
  render: () => (
    <>
      <Cover.Root space="m" data-min="20rem" style={knob("20rem")}>
        {parts}
      </Cover.Root>
      <Cover.Root space="m" data-min="0" style={knob("0")}>
        <div data-part="header" style={tile("2rem")} />
        <Cover.Centered style={tile("3rem")} />
      </Cover.Root>
      <Cover.Root space="m" data-min="class" className="story-cover">
        <Cover.Centered style={tile("3rem")} />
      </Cover.Root>
    </>
  ),
  play: async ({ canvasElement }) => {
    const twenty = nodeIn(canvasElement, '[data-min="20rem"]');
    await expect(twenty.getBoundingClientRect().height).toBeCloseTo(
      resolvedLength(twenty, "20rem"),
      1,
    );

    const zero = nodeIn(canvasElement, '[data-min="0"]');
    await expect(zero.getBoundingClientRect().height).toBeCloseTo(
      resolvedLength(zero, "5rem") + resolvedGap("m", zero),
      1,
    );

    // A consumer's class wins over the layered default whatever the load order.
    const restore = prepend(".story-cover { --el-cover-min: 12rem; }");
    try {
      const own = nodeIn(canvasElement, '[data-min="class"]');
      await expect(own.getBoundingClientRect().height).toBeCloseTo(
        resolvedLength(own, "12rem"),
        1,
      );
    } finally {
      restore();
    }
  },
};

/**
 * A consumer's block margin on the centred child, at one class and loaded
 * last, doesn't beat the auto margins.
 */
export const ConsumerMargin: Story = {
  args: { space: "m", children: parts },
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
        <Cover.Root key={step} space={step} data-step={step} style={knob("0")}>
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
