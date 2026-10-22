import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Center, Stack, spaces } from "@timhettler/radix-layout";

import { resolvedGap } from "../lib/space";
import { componentAttributeValues } from "../lib/stylesheets";

function nodeIn(root: Element, selector = ".el-center") {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Nothing rendered for "${selector}"`);
  return node;
}

/** A length in px, resolved inside `parent`, so `ch` uses the center's font. */
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

const paddingOf = (node: Element) => {
  const style = getComputedStyle(node);
  return {
    start: parseFloat(style.paddingInlineStart),
    end: parseFloat(style.paddingInlineEnd),
  };
};

/** The content box's width, from the border box so it keeps sub-pixel widths. */
const contentWidthOf = (node: Element) => {
  const { start, end } = paddingOf(node);
  return node.getBoundingClientRect().width - start - end;
};

/** The space left of and right of `node` inside `frame`. */
const offsetsIn = (frame: Element, node: Element) => {
  const outer = frame.getBoundingClientRect();
  const inner = node.getBoundingClientRect();
  return { start: inner.left - outer.left, end: outer.right - inner.right };
};

const setWidth = (frame: HTMLElement, px: number) => {
  frame.style.inlineSize = `${px}px`;
};

/** Wider than the measure plus the largest default gutter on both sides. */
const WIDE = 1200;

/** Narrower than the measure. */
const NARROW = 300;

/** Prepends `css` before every sheet, so it wins only where the defaults are layered (ADR 0003 § 1). */
function prepend(css: string) {
  const override = document.createElement("style");
  override.textContent = css;
  document.head.prepend(override);
  return () => override.remove();
}

const prose =
  "A centred column holds running text to a readable measure, and keeps a gutter either side when its parent is narrower than that.";

const meta = {
  title: "Layouts/Center",
  component: Center,
  parameters: { layout: "padded" },
  argTypes: {
    // Taken from the library, not restated — a restated list drifts.
    gutter: { control: "select", options: spaces },
  },
} satisfies Meta<typeof Center>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Centred at the measure, `60ch` in its own font, with no gutter. */
export const Default: Story = {
  args: {
    children: (
      <>
        <h2>Our documentation</h2>
        <p>{prose}</p>
      </>
    ),
  },
  render: (args) => (
    <div data-frame="">
      <Center {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const node = nodeIn(frame);

    await expect(node.tagName).toBe("DIV");
    await expect(node.hasAttribute("data-gutter")).toBe(false);
    await expect(getComputedStyle(node).boxSizing).toBe("border-box");
    await expect(paddingOf(node)).toEqual({ start: 0, end: 0 });

    setWidth(frame, WIDE);
    const measure = resolvedLength(node, "60ch");
    await expect(node.getBoundingClientRect().width).toBeCloseTo(measure, 1);
    const { start, end } = offsetsIn(frame, node);
    await expect(start).toBeCloseTo((WIDE - measure) / 2, 1);
    await expect(end).toBeCloseTo(start, 1);
  },
};

/** Narrower than the measure, it fills its parent. */
export const Narrow: Story = {
  args: { children: <p>{prose}</p> },
  render: (args) => (
    <div data-frame="">
      <Center {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const node = nodeIn(frame);

    setWidth(frame, NARROW);
    await expect(node.getBoundingClientRect().width).toBeCloseTo(NARROW, 1);
    await expect(offsetsIn(frame, node).start).toBeCloseTo(0, 1);
  },
};

/**
 * Every step on the space scale has a rule. The gutter grows outward from the
 * measure when there is room, and comes out of the content when there isn't.
 */
export const Gutters: Story = {
  render: () => (
    <div data-frame="">
      {spaces.map((step) => (
        <Center key={step} gutter={step} data-step={step}>
          <p>gutter=&quot;{step}&quot;</p>
        </Center>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      [...componentAttributeValues("el-center", "data-gutter")].sort(),
    ).toEqual([...spaces].sort());

    const frame = nodeIn(canvasElement, "[data-frame]");
    const measure = resolvedLength(nodeIn(frame), "60ch");

    for (const step of spaces) {
      const node = nodeIn(frame, `[data-step="${step}"]`);
      const gutter = resolvedGap(step, frame);
      const padding = paddingOf(node);
      await expect(padding.start, step).toBeCloseTo(gutter, 1);
      await expect(padding.end, step).toBeCloseTo(gutter, 1);
      await expect(getComputedStyle(node).paddingBlockStart, step).toBe("0px");

      setWidth(frame, WIDE);
      await expect(contentWidthOf(node), `${step} wide`).toBeCloseTo(
        measure,
        1,
      );

      setWidth(frame, NARROW);
      await expect(node.getBoundingClientRect().width, step).toBeCloseTo(
        NARROW,
        1,
      );
      await expect(contentWidthOf(node), `${step} narrow`).toBeCloseTo(
        NARROW - 2 * gutter,
        1,
      );
    }
  },
};

/**
 * A stack's child with auto margins doesn't stretch, so a center holding one
 * short heading would shrink to it. It fills the stack up to the measure.
 */
export const InAStack: Story = {
  render: () => (
    <div data-frame="">
      <Stack space="l">
        <Center data-demo="bare">
          <h2>Shop</h2>
        </Center>
        <Center gutter="m" data-demo="gutter">
          <p>Short.</p>
        </Center>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const bare = nodeIn(frame, '[data-demo="bare"]');
    const withGutter = nodeIn(frame, '[data-demo="gutter"]');
    const measure = resolvedLength(bare, "60ch");
    const gutter = resolvedGap("m", frame);

    setWidth(frame, WIDE);
    await expect(bare.getBoundingClientRect().width).toBeCloseTo(measure, 1);
    await expect(withGutter.getBoundingClientRect().width).toBeCloseTo(
      measure + 2 * gutter,
      1,
    );
    // The heading starts the column; a shrunk center would centre it instead.
    const heading = nodeIn(bare, "h2").getBoundingClientRect();
    await expect(heading.left).toBeCloseTo(
      bare.getBoundingClientRect().left,
      1,
    );
    await expect(offsetsIn(frame, bare).start).toBeCloseTo(
      (WIDE - measure) / 2,
      1,
    );

    setWidth(frame, NARROW);
    await expect(bare.getBoundingClientRect().width).toBeCloseTo(NARROW, 1);
  },
};

/**
 * Merged onto a stack with `align="center"`, children narrower than the
 * column are centred in it, and running text still fills it.
 */
export const IntrinsicCentering: Story = {
  render: () => (
    <div data-frame="">
      <Center asChild gutter="m">
        <Stack space="m" align="center">
          <p>{prose}</p>
          <button type="button">Launch demo</button>
        </Stack>
      </Center>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const node = nodeIn(frame);

    // One element, both layouts, and neither attribute overwrote the other.
    await expect(node.classList.contains("el-stack")).toBe(true);
    await expect(node.getAttribute("data-gutter")).toBe("m");
    await expect(node.getAttribute("data-space")).toBe("m");
    await expect(node.getAttribute("data-align")).toBe("center");
    await expect(node.parentElement).toBe(frame);
    await expect(getComputedStyle(node).flexDirection).toBe("column");

    const gutter = resolvedGap("m", frame);
    await expect(paddingOf(node).start).toBeCloseTo(gutter, 1);

    for (const width of [WIDE, NARROW]) {
      setWidth(frame, width);
      const box = node.getBoundingClientRect();
      const button = nodeIn(node, "button").getBoundingClientRect();
      await expect(button.left + button.width / 2, `${width}px`).toBeCloseTo(
        box.left + box.width / 2,
        1,
      );
      await expect(
        nodeIn(node, "p").getBoundingClientRect().width,
        `${width}px`,
      ).toBeCloseTo(contentWidthOf(node), 1);
    }
  },
};

/** A consumer's measure on a class of their own wins, whatever the load order. */
export const RemappedMax: Story = {
  render: () => (
    <div data-frame="">
      <Center className="article">
        <p>{prose}</p>
      </Center>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(".article { --el-center-max: 20rem; }");

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const node = nodeIn(frame);
      setWidth(frame, WIDE);
      await expect(node.getBoundingClientRect().width).toBeCloseTo(
        resolvedLength(node, "20rem"),
        1,
      );
    } finally {
      restore();
    }
  },
};

/**
 * An off-scale gutter beats the `gutter` prop's step, and moves the padding
 * and the cap together, so the content keeps the measure.
 */
export const OffScaleGutter: Story = {
  render: () => (
    <div data-frame="">
      <Center className="page" gutter="s">
        <p>{prose}</p>
      </Center>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(
      ".page { --el-center-max: 30rem; --el-center-gutter: 2rem; }",
    );

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const node = nodeIn(frame);
      const gutter = resolvedLength(node, "2rem");
      const max = resolvedLength(node, "30rem");

      setWidth(frame, WIDE);
      await expect(paddingOf(node).start).toBeCloseTo(gutter, 1);
      await expect(node.getBoundingClientRect().width).toBeCloseTo(
        max + 2 * gutter,
        1,
      );
      await expect(contentWidthOf(node)).toBeCloseTo(max, 1);
    } finally {
      restore();
    }
  },
};

/**
 * A percentage gutter resolves against the parent in both the padding and the
 * cap, so the content keeps the measure.
 */
export const PercentageGutter: Story = {
  render: () => (
    <div data-frame="">
      <Center className="page">
        <p>{prose}</p>
      </Center>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(".page { --el-center-gutter: max(1rem, 5%); }");

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const node = nodeIn(frame);
      const rem = resolvedLength(node, "1rem");

      for (const width of [WIDE, NARROW]) {
        setWidth(frame, width);
        await expect(paddingOf(node).start, `${width}px`).toBeCloseTo(
          Math.max(rem, 0.05 * width),
          1,
        );
      }

      setWidth(frame, WIDE);
      await expect(contentWidthOf(node)).toBeCloseTo(
        resolvedLength(node, "60ch"),
        1,
      );
    } finally {
      restore();
    }
  },
};

/**
 * The layout rule is unlayered and sets only inline margins, so a product's
 * element reset can't undo it and the product's own block margin survives.
 */
export const ProductResets: Story = {
  render: () => (
    <div data-frame="">
      <Center className="spaced" gutter="m">
        <p>{prose}</p>
      </Center>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(
      "div { margin: 0; padding: 0; } .spaced { margin-block: 40px; }",
    );

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const node = nodeIn(frame);
      setWidth(frame, WIDE);

      const style = getComputedStyle(node);
      await expect([style.marginBlockStart, style.marginBlockEnd]).toEqual([
        "40px",
        "40px",
      ]);
      await expect(paddingOf(node).start).toBeCloseTo(
        resolvedGap("m", frame),
        1,
      );
      const { start, end } = offsetsIn(frame, node);
      await expect(start).toBeGreaterThan(0);
      await expect(end).toBeCloseTo(start, 1);
    } finally {
      restore();
    }
  },
};

/**
 * A unitless `0` or a step name removes the gutter and keeps
 * the cap. Unregistered, either would invalidate the cap's calc and leave the
 * center as wide as its parent.
 */
export const ZeroGutter: Story = {
  render: () => (
    <div data-frame="">
      <Center className="zero" gutter="l" data-demo="zero">
        <p>{prose}</p>
      </Center>
      <Center className="step-name" gutter="l" data-demo="step-name">
        <p>{prose}</p>
      </Center>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(
      ".zero { --el-center-gutter: 0; } .step-name { --el-center-gutter: m; }",
    );

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      setWidth(frame, WIDE);

      for (const demo of ["zero", "step-name"]) {
        const node = nodeIn(frame, `[data-demo="${demo}"]`);
        await expect(paddingOf(node), demo).toEqual({ start: 0, end: 0 });
        await expect(node.getBoundingClientRect().width, demo).toBeCloseTo(
          resolvedLength(node, "60ch"),
          1,
        );
      }
    } finally {
      restore();
    }
  },
};

/** A nested center keeps its own defaults rather than inheriting the outer one's. */
export const Nested: Story = {
  render: () => (
    <div data-frame="">
      <Center className="outer" gutter="xl">
        <Center data-demo="inner">
          <p>{prose}</p>
        </Center>
      </Center>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(".outer { --el-center-max: 50rem; }");

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const outer = nodeIn(frame, ".outer");
      const inner = nodeIn(frame, '[data-demo="inner"]');
      setWidth(frame, WIDE);

      await expect(contentWidthOf(outer)).toBeCloseTo(
        resolvedLength(outer, "50rem"),
        1,
      );
      await expect(paddingOf(inner)).toEqual({ start: 0, end: 0 });
      await expect(inner.getBoundingClientRect().width).toBeCloseTo(
        resolvedLength(inner, "60ch"),
        1,
      );
    } finally {
      restore();
    }
  },
};

/**
 * `asChild` makes the center your element, merging onto it rather than
 * wrapping it, and a `ref` reaches the rendered element.
 */
export const Semantics: Story = {
  render: function Render() {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      ref.current?.setAttribute("data-ref-attached", "");
    }, []);

    return (
      <div>
        <Center asChild gutter="m">
          <main className="page">
            <p>{prose}</p>
          </main>
        </Center>
        <Center ref={ref} className="extra" data-demo="classname">
          <p>{prose}</p>
        </Center>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const main = nodeIn(canvasElement, "main");
    // Slot-first is Radix's order; this pins it, not cx().
    await expect(main.className).toBe("el-center page");
    await expect(main.getAttribute("data-gutter")).toBe("m");
    await expect(main.parentElement?.classList.contains("el-center")).toBe(
      false,
    );

    const withClass = nodeIn(canvasElement, '[data-demo="classname"]');
    await expect(withClass.className).toBe("el-center extra");
    await expect(withClass.hasAttribute("data-ref-attached")).toBe(true);
  },
};
