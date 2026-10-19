import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Switcher, spaces, switcherMins } from "@timhettler/radix-layout";

import { resolvedGap } from "../lib/space";
import { componentAttributeValues } from "../lib/stylesheets";

/** The boxes a reader sees: a `display: none` child has none. */
const rects = (node: Element) =>
  [...node.children]
    .map((child) => child.getBoundingClientRect())
    .filter((box) => box.width > 0);

const sorted = (values: readonly string[]) => [...values].sort();

/** The values `switcher.css` accepts for one `data-*` axis. */
const acceptedValues = (attribute: string) =>
  componentAttributeValues("el-switcher", attribute);

function switcherIn(root: Element, selector = ".el-switcher") {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`No switcher rendered for "${selector}"`);
  return node;
}

const isRow = (node: Element) => {
  const boxes = rects(node);
  return boxes.every((box) => Math.abs(box.top - boxes[0].top) < 0.5);
};

/** `--el-switcher-min` in px, resolved inside an item, where the basis reads it. */
function resolvedMin(node: HTMLElement) {
  const probe = document.createElement("div");
  probe.setAttribute(
    "style",
    "position: absolute; visibility: hidden; inline-size: var(--el-switcher-min)",
  );
  node.firstElementChild!.append(probe);
  const value = probe.getBoundingClientRect().width;
  probe.remove();
  return value;
}

/** The width the row needs: every child at the minimum, plus the gaps. */
function threshold(node: HTMLElement) {
  const count = node.children.length;
  const gap = parseFloat(getComputedStyle(node).columnGap);
  return resolvedMin(node) * count + gap * (count - 1);
}

/** The children's padding and border, which `contain-intrinsic-inline-size` leaves out. */
const childFrames = (node: Element) =>
  [...node.children].reduce((sum, child) => {
    const style = getComputedStyle(child);
    return (
      sum +
      parseFloat(style.paddingInlineStart) +
      parseFloat(style.paddingInlineEnd) +
      parseFloat(style.borderInlineStartWidth) +
      parseFloat(style.borderInlineEndWidth)
    );
  }, 0);

/** Above layout's 1/64px rounding, and well inside the band a 999 basis leaves. */
const NEAR = 0.1;

const setWidth = (frame: HTMLElement, px: number) => {
  frame.style.inlineSize = `${px}px`;
};

/** A plain box with a visible edge, so the stories read without any design system. */
const tile = {
  border: "1px solid currentColor",
  padding: "0.5rem",
} as const;

const tiles = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <div key={index} style={tile}>
      Item {index + 1}
    </div>
  ));

const meta = {
  title: "Layouts/Switcher",
  component: Switcher,
  parameters: { layout: "padded" },
  argTypes: {
    // Taken from the library, not restated — a restated list drifts.
    space: { control: "select", options: spaces },
    min: { control: "select", options: switcherMins },
  },
} satisfies Meta<typeof Switcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    space: "m",
    children: (
      <>
        <div style={tile}>Basic</div>
        <div style={tile}>Pro</div>
        <div style={tile}>Team</div>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = switcherIn(canvasElement);

    // The documented default element, and the attribute the required prop writes.
    await expect(node.tagName).toBe("DIV");
    await expect(node.getAttribute("data-space")).toBe("m");
    await expect(node.hasAttribute("data-min")).toBe(false);

    const style = getComputedStyle(node);
    await expect(style.display).toBe("flex");
    await expect(style.flexWrap).toBe("wrap");
    await expect(parseFloat(style.columnGap)).toBeCloseTo(resolvedGap("m"), 1);

    // An omitted `min` is the class's own default, `m`.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(resolvedMin(node)).toBeCloseTo(15 * rem, 1);

    // Whatever width the canvas gives it, it is one of the two shapes.
    const width = node.getBoundingClientRect().width;
    await expect(isRow(node)).toBe(width >= threshold(node));
  },
};

const MIN_REM = { s: 10, m: 15, l: 20 } as const;

/** Every `min` has a rule, and each resolves to its width. */
export const Minimums: Story = {
  args: { space: "s" },
  render: () => (
    <div>
      {switcherMins.map((min) => (
        <Switcher key={min} space="s" min={min} data-min-demo="">
          {tiles(2)}
        </Switcher>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(sorted(acceptedValues("data-min"))).toEqual(
      sorted(switcherMins),
    );

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    for (const node of canvasElement.querySelectorAll<HTMLElement>(
      "[data-min-demo]",
    )) {
      const min = node.dataset.min as keyof typeof MIN_REM;
      await expect(resolvedMin(node), min).toBeCloseTo(MIN_REM[min] * rem, 1);
    }
  },
};

/** Every step on the space scale has a rule, and every rule renders its step. */
export const Spacing: Story = {
  args: { space: "m" },
  render: () => (
    <div>
      {spaces.map((step) => (
        <Switcher key={step} space={step} min="s" data-step={step}>
          {tiles(2)}
        </Switcher>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(sorted(acceptedValues("data-space"))).toEqual(sorted(spaces));

    for (const step of spaces) {
      const node = switcherIn(canvasElement, `[data-step="${step}"]`);
      await expect(
        parseFloat(getComputedStyle(node).columnGap),
        `space="${step}"`,
      ).toBeCloseTo(resolvedGap(step), 1);
    }
  },
};

const COUNTS = [2, 3, 5, 7, 12] as const;

/**
 * The row holds while every child fits at the minimum, and every child stacks
 * at once below it, at any count: there is no cap.
 */
export const Threshold: Story = {
  args: { space: "s" },
  render: () => (
    <div>
      {COUNTS.map((count) => (
        <div key={count} data-count={count}>
          <Switcher space="s" min="s">
            {tiles(count)}
          </Switcher>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const count of COUNTS) {
      const frame = switcherIn(canvasElement, `[data-count="${count}"]`);
      const node = switcherIn(frame);
      const row = threshold(node);

      setWidth(frame, row + NEAR);
      await expect(isRow(node), `${count} items at ${row + NEAR}px`).toBe(true);

      // Equal shares of the row, whatever each child's content.
      const gap = parseFloat(getComputedStyle(node).columnGap);
      for (const box of rects(node)) {
        await expect(box.width).toBeCloseTo(
          (row + NEAR - gap * (count - 1)) / count,
          1,
        );
      }

      setWidth(frame, row - NEAR);
      await expect(isRow(node), `${count} items at ${row - NEAR}px`).toBe(
        false,
      );
      for (const box of rects(node)) {
        await expect(box.width).toBeCloseTo(row - NEAR, 1);
      }
    }
  },
};

/**
 * Inside a query container the fluid gap changes with the width, and the
 * switch still lands where the gap at that width says. Containers on the
 * children don't move it.
 */
export const FluidGap: Story = {
  args: { space: "l" },
  render: () => (
    <div data-frame="" style={{ containerType: "inline-size" }}>
      <Switcher space="l" min="s">
        {tiles(3)}
      </Switcher>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = switcherIn(canvasElement, "[data-frame]");
    const node = switcherIn(frame);

    setWidth(frame, 600);
    const start = Math.floor(threshold(node));

    for (let width = start - 3; width <= start + 3; width += 0.25) {
      setWidth(frame, width);
      const row = threshold(node);
      // Layout rounds to 1/64px, so skip a width that lands on the threshold.
      if (Math.abs(width - row) < 0.05) continue;
      await expect(isRow(node), `${width}px`).toBe(width >= row);
    }
  },
};

/**
 * Each child is a query container, so its content never sizes it: a long word
 * overflows its own child, and the row stays equal.
 */
export const EqualWidths: Story = {
  args: { space: "s" },
  render: () => (
    <div data-frame="">
      <Switcher space="s" min="s">
        {/* A <p>, so a missing margin reset shows as a child pushed off the row. */}
        <p style={tile}>A</p>
        <div style={tile} data-demo="long">
          Supercalifragilisticexpialidocious
        </div>
        <div style={tile}>
          <div data-demo="half" style={{ inlineSize: "50cqi" }} />
        </div>
      </Switcher>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = switcherIn(canvasElement, "[data-frame]");
    const node = switcherIn(frame);
    setWidth(frame, threshold(node) + 20);

    for (const child of node.children) {
      await expect(getComputedStyle(child).containerType).toBe("inline-size");
    }

    const [first, ...others] = rects(node);
    await expect(isRow(node)).toBe(true);
    for (const box of others) {
      await expect(box.width).toBeCloseTo(first.width, 1);
    }

    const long = switcherIn(canvasElement, '[data-demo="long"]');
    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);

    // cqi in a child's content resolves against that child.
    const half = switcherIn(canvasElement, '[data-demo="half"]');
    const cell = half.parentElement!;
    await expect(half.getBoundingClientRect().width).toBeCloseTo(
      cell.clientWidth / 2 -
        parseFloat(getComputedStyle(cell).paddingInlineStart),
      0,
    );
  },
};

/**
 * A parent sized by its content still gets the row when it has room: the
 * switcher's own width is the row at the minimum, plus each child's padding
 * and border.
 */
export const ShrinkToFit: Story = {
  args: { space: "s" },
  render: () => (
    <div>
      <div data-frame="inline-block">
        <div style={{ display: "inline-block" }}>
          <Switcher space="s" min="s">
            {tiles(3)}
          </Switcher>
        </div>
      </div>
      <div data-frame="absolute" style={{ position: "relative" }}>
        <div style={{ position: "absolute", insetInlineStart: 0 }}>
          <Switcher space="s" min="s">
            {tiles(3)}
          </Switcher>
        </div>
      </div>
      <div
        data-frame="bar"
        style={{ display: "flex", gap: "1rem", marginBlockStart: "12rem" }}
      >
        <p style={{ flex: "none", inlineSize: "8rem", margin: 0 }}>Plans</p>
        <Switcher space="s" min="s">
          {tiles(3)}
        </Switcher>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const kind of ["inline-block", "absolute"]) {
      const frame = switcherIn(canvasElement, `[data-frame="${kind}"]`);
      const node = switcherIn(frame);
      const row = threshold(node);
      const frames = childFrames(node);

      setWidth(frame, row + frames + 200);
      await expect(isRow(node), kind).toBe(true);
      await expect(node.getBoundingClientRect().width, kind).toBeCloseTo(
        row + frames,
        0,
      );

      setWidth(frame, row - 1);
      await expect(isRow(node), kind).toBe(false);
      await expect(node.getBoundingClientRect().width, kind).toBeCloseTo(
        row - 1,
        0,
      );

      // Never narrower than one child at the minimum in a parent that sizes
      // to content.
      setWidth(frame, resolvedMin(node) / 2);
      await expect(node.getBoundingClientRect().width, kind).toBeCloseTo(
        resolvedMin(node) + frames / node.children.length,
        0,
      );
    }

    // A non-growing flex item beside a title: the bar holds the row until the
    // title, the bar's gap and the row stop fitting.
    const bar = switcherIn(canvasElement, '[data-frame="bar"]');
    const node = switcherIn(bar);
    const title = bar.querySelector("p")!.getBoundingClientRect().width;
    const needed =
      title + parseFloat(getComputedStyle(bar).columnGap) + threshold(node);

    setWidth(bar, needed + NEAR);
    await expect(isRow(node)).toBe(true);
    setWidth(bar, needed - NEAR);
    await expect(isRow(node)).toBe(false);
  },
};

/**
 * A `display: none` child still counts, so three visible children switch at
 * four children's threshold.
 */
export const HiddenChild: Story = {
  args: { space: "s" },
  render: () => (
    <div data-frame="">
      <Switcher space="s" min="s">
        {tiles(3)}
        <div style={{ display: "none" }}>Hidden</div>
      </Switcher>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = switcherIn(canvasElement, "[data-frame]");
    const node = switcherIn(frame);
    const gap = parseFloat(getComputedStyle(node).columnGap);
    const visibleRow = resolvedMin(node) * 3 + gap * 2;

    setWidth(frame, visibleRow + 0.5);
    await expect(isRow(node)).toBe(false);

    setWidth(frame, threshold(node) + 0.5);
    await expect(isRow(node)).toBe(true);
  },
};

/**
 * The knobs are set on the consumer's own class at equal specificity, injected
 * before every sheet, so they win only because the defaults are layered (ADR
 * 0003 § 1). A bare `gap` loses to the `[data-space]` rule even loaded last, so
 * the gap and the basis can't disagree. A nested switcher keeps its own
 * defaults.
 */
export const ConsumerKnobs: Story = {
  args: { space: "s" },
  render: () => (
    <div data-frame="">
      <Switcher space="s" className="tiers">
        <div style={tile}>
          <Switcher space="s" data-demo="nested">
            {tiles(2)}
          </Switcher>
        </div>
        <div style={tile}>Two</div>
      </Switcher>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const override = document.createElement("style");
    override.textContent =
      ".tiers { --el-switcher-min: 12rem; --el-switcher-space: 40px; }";
    document.head.prepend(override);
    // A bare gap from a sheet loaded after the library's, where load order
    // can't be what keeps it out.
    const bareGap = document.createElement("style");
    bareGap.textContent = ".tiers { gap: 99px; }";
    document.head.append(bareGap);

    try {
      const node = switcherIn(canvasElement, ".tiers");
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      await expect(resolvedMin(node)).toBeCloseTo(12 * rem, 1);
      await expect(parseFloat(getComputedStyle(node).columnGap)).toBe(40);

      const frame = switcherIn(canvasElement, "[data-frame]");
      setWidth(frame, 24 * rem + 40);
      await expect(isRow(node)).toBe(true);
      setWidth(frame, 24 * rem + 39);
      await expect(isRow(node)).toBe(false);

      const nested = switcherIn(canvasElement, '[data-demo="nested"]');
      await expect(resolvedMin(nested)).toBeCloseTo(15 * rem, 1);
      await expect(parseFloat(getComputedStyle(nested).columnGap)).toBeCloseTo(
        resolvedGap("s", nested.parentElement!),
        1,
      );
    } finally {
      override.remove();
      bareGap.remove();
    }
  },
};

/**
 * `asChild` makes the switcher something other than a `<div>`, merging onto
 * the child rather than wrapping it.
 */
export const Semantics: Story = {
  args: { space: "m" },
  render: () => (
    // `role="list"` is not decoration: Safari drops list semantics from a `ul`
    // whose `list-style` is `none`, which a product's reset routinely sets.
    <Switcher asChild space="m" min="s">
      <ul
        className="tiers"
        role="list"
        style={{ margin: 0, padding: 0, listStyle: "none" }}
      >
        <li style={tile}>Basic</li>
        <li style={tile}>Pro</li>
        <li style={tile}>Team</li>
      </ul>
    </Switcher>
  ),
  play: async ({ canvasElement }) => {
    const list = switcherIn(canvasElement, "ul");

    await expect(list.getAttribute("data-space")).toBe("m");
    await expect(list.getAttribute("role")).toBe("list");
    // Slot-first is Radix's order; this pins it, not cx().
    await expect(list.className).toBe("el-switcher tiers");
    await expect(list.parentElement?.classList.contains("el-switcher")).toBe(
      false,
    );
    for (const item of list.children) {
      await expect(item.tagName).toBe("LI");
      await expect(getComputedStyle(item).containerType).toBe("inline-size");
    }
  },
};
