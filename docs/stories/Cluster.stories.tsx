import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  Cluster,
  Stack,
  clusterAligns,
  clusterDisplays,
  clusterJustifies,
  spaces,
} from "@timhettler/radix-layout";

import { resolvedGap } from "../lib/space";
import { componentAttributeValues } from "../lib/stylesheets";

const rects = (node: Element) =>
  [...node.children].map((child) => child.getBoundingClientRect());

const sorted = (values: readonly string[]) => [...values].sort();

/** The values `cluster.css` accepts for one `data-*` axis, read out of the loaded stylesheet. */
const acceptedValues = (attribute: string) =>
  componentAttributeValues("el-cluster", attribute);

function clusterIn(root: HTMLElement, selector = ".el-cluster") {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`No cluster rendered for "${selector}"`);
  return node;
}

/** A plain box with a visible edge, so the stories read without any design system. */
const chip = {
  border: "1px solid currentColor",
  padding: "0.25rem 0.5rem",
} as const;

const meta = {
  title: "Layouts/Cluster",
  component: Cluster,
  parameters: { layout: "padded" },
  argTypes: {
    // Taken from the library, not restated — a restated list drifts.
    space: { control: "select", options: spaces },
    justify: { control: "select", options: clusterJustifies },
    align: { control: "select", options: clusterAligns },
    display: { control: "select", options: clusterDisplays },
  },
} satisfies Meta<typeof Cluster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    space: "m",
    children: (
      <>
        <button type="button">Save</button>
        <button type="button">Cancel</button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = clusterIn(canvasElement);

    // The documented default element, and the attribute the required prop writes.
    await expect(node.tagName).toBe("DIV");
    await expect(node.getAttribute("data-space")).toBe("m");

    await expect(node.hasAttribute("data-justify")).toBe(false);
    await expect(node.hasAttribute("data-align")).toBe(false);
    await expect(node.hasAttribute("data-display")).toBe(false);

    // And the class's own defaults, which is what an omitted axis renders.
    const style = getComputedStyle(node);
    await expect(style.display).toBe("flex");
    await expect(style.flexWrap).toBe("wrap");
    await expect(style.justifyContent).toBe("flex-start");
    await expect(style.alignItems).toBe("safe center");

    const [first, second] = rects(node);
    await expect(second.top).toBe(first.top);
    await expect(second.left - first.right).toBeCloseTo(resolvedGap("m"), 1);
  },
};

/**
 * Every step on the space scale has a rule, and every rule renders its step.
 */
export const Spacing: Story = {
  args: { space: "l" },
  render: () => (
    <Stack space="xl">
      {spaces.map((step) => (
        <div key={step} data-step={step}>
          <p>space=&quot;{step}&quot;</p>
          <Cluster space={step}>
            <span style={chip}>One</span>
            <span style={chip}>Two</span>
          </Cluster>
        </div>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(sorted(acceptedValues("data-space"))).toEqual(sorted(spaces));

    for (const step of spaces) {
      const node = clusterIn(
        canvasElement,
        `[data-step="${step}"] .el-cluster`,
      );
      const [first, second] = rects(node);
      await expect(second.left - first.right, `space="${step}"`).toBeCloseTo(
        resolvedGap(step),
        1,
      );
    }
  },
};

/** Each keyword computes to the value its map says. */
const JUSTIFY_VALUE = {
  start: "flex-start",
  center: "safe center",
  end: "safe flex-end",
  between: "space-between",
} as const;

const ALIGN_VALUE = {
  start: "flex-start",
  center: "safe center",
  end: "safe flex-end",
  stretch: "stretch",
} as const;

export const Alignment: Story = {
  args: { space: "m" },
  render: () => (
    <Stack space="xl">
      {clusterJustifies.map((justify) => (
        <Cluster key={justify} space="m" justify={justify} data-justify-demo="">
          <span style={chip}>justify=&quot;{justify}&quot;</span>
          <span style={chip}>Two</span>
        </Cluster>
      ))}
      {clusterAligns.map((align) => (
        <Cluster key={align} space="m" align={align} data-align-demo="">
          <span style={chip}>align=&quot;{align}&quot;</span>
          <span style={{ ...chip, paddingBlock: "2rem" }}>Tall</span>
        </Cluster>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(sorted(acceptedValues("data-justify"))).toEqual(
      sorted(clusterJustifies),
    );
    await expect(sorted(acceptedValues("data-align"))).toEqual(
      sorted(clusterAligns),
    );

    for (const node of canvasElement.querySelectorAll<HTMLElement>(
      "[data-justify-demo]",
    )) {
      const justify = node.dataset.justify as keyof typeof JUSTIFY_VALUE;
      await expect(getComputedStyle(node).justifyContent, justify).toBe(
        JUSTIFY_VALUE[justify],
      );
    }

    for (const node of canvasElement.querySelectorAll<HTMLElement>(
      "[data-align-demo]",
    )) {
      const align = node.dataset.align as keyof typeof ALIGN_VALUE;
      await expect(getComputedStyle(node).alignItems, align).toBe(
        ALIGN_VALUE[align],
      );
    }

    // And the measured consequence of `stretch`, the one value whose effect is
    // on the children's size rather than their position.
    const stretch = clusterIn(canvasElement, '[data-align="stretch"]');
    const [short, tall] = rects(stretch);
    await expect(short.height).toBeCloseTo(tall.height, 0);
  },
};

/**
 * The box level: `block` fills the width it is given, `inline` shrink-wraps and
 * sits in a line of text.
 */
export const BoxLevel: Story = {
  args: { space: "s" },
  render: () => (
    <Stack space="xl">
      <div data-demo="block">
        <Cluster space="s" display="block">
          <span style={chip}>One</span>
          <span style={chip}>Two</span>
        </Cluster>
      </div>
      {/* `asChild` onto a <span>, because an inline-level box inside a paragraph
          is the case this axis exists for, and a <div> there would be invalid. */}
      <p data-demo="paragraph">
        Text before{" "}
        <Cluster asChild space="s" display="inline" data-demo="inline">
          <span>
            <span style={chip}>One</span>
            <span style={chip}>Two</span>
          </span>
        </Cluster>{" "}
        and text after.
      </p>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(sorted(acceptedValues("data-display"))).toEqual(
      sorted(clusterDisplays),
    );

    const frame = clusterIn(canvasElement, '[data-demo="block"]');
    const block = clusterIn(canvasElement, '[data-demo="block"] .el-cluster');
    await expect(getComputedStyle(block).display).toBe("flex");
    await expect(block.getBoundingClientRect().width).toBeCloseTo(
      frame.getBoundingClientRect().width,
      0,
    );

    const paragraph = clusterIn(canvasElement, '[data-demo="paragraph"]');
    const inline = clusterIn(canvasElement, '[data-demo="inline"]');
    await expect(inline.tagName).toBe("SPAN");
    await expect(getComputedStyle(inline).display).toBe("inline-flex");
    await expect(inline.getBoundingClientRect().width).toBeLessThan(
      paragraph.getBoundingClientRect().width / 2,
    );
  },
};

/** No per-item wrapper: the caller's elements are the flex items. */
export const Wrapping: Story = {
  args: { space: "m" },
  render: () => (
    <div style={{ maxInlineSize: "12rem" }}>
      <Cluster space="m">
        {["One", "Two", "Three", "Four", "Five"].map((label) => (
          <button key={label} type="button">
            {label}
          </button>
        ))}
      </Cluster>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const node = clusterIn(canvasElement);
    await expect(node.children).toHaveLength(5);
    for (const child of node.children) {
      await expect(child.tagName, "a wrapper element was injected").toBe(
        "BUTTON",
      );
    }

    // Constrained narrower than the five fit in, so the last lands on a later
    // line — and the line gap is the same step as the column gap.
    const boxes = rects(node);
    const firstLine = boxes.filter((box) => box.top === boxes[0].top);
    await expect(firstLine.length).toBeLessThan(boxes.length);
    const nextLine = boxes[firstLine.length];
    await expect(nextLine.top - firstLine[0].bottom).toBeCloseTo(
      resolvedGap("m"),
      1,
    );
  },
};

/**
 * `asChild` makes the cluster something other than a `<div>`, merging onto the
 * child rather than wrapping it.
 */
export const Semantics: Story = {
  args: { space: "s" },
  render: () => (
    <Stack space="xl">
      {/* `role="list"` is not decoration: Safari drops list semantics from a
          `ul` whose `list-style` is `none`, which a product's reset routinely sets. */}
      <Cluster asChild space="s" data-demo="chips">
        <ul
          className="chips"
          role="list"
          style={{ margin: 0, padding: 0, listStyle: "none" }}
        >
          <li>
            <button type="button">Filters</button>
          </li>
          <li>
            <button type="button">Sort</button>
          </li>
        </ul>
      </Cluster>

      <Cluster asChild space="m">
        <nav aria-label="Pagination">
          <a href="#previous">Previous</a>
          <a href="#next">Next</a>
        </nav>
      </Cluster>
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    // Queried by tag rather than by role: `getByRole('list')` matches a bare
    // <ul> through its implicit role whether or not `role="list"` survived.
    const list = clusterIn(canvasElement, "ul");

    await expect(list.getAttribute("data-space")).toBe("s");
    await expect(list.getAttribute("role")).toBe("list");

    // Slot-first is Radix's order; this pins it, not cx().
    await expect(list.className).toBe("el-cluster chips");

    // A prop the Cluster itself was given, on an element it did not render.
    await expect(list.getAttribute("data-demo")).toBe("chips");

    // No wrapper survived: the <ul> *is* the cluster.
    await expect(list.parentElement?.classList.contains("el-cluster")).toBe(
      false,
    );

    const nav = canvas.getByRole("navigation");
    await expect(nav).toHaveClass("el-cluster");
    await expect(nav.children).toHaveLength(2);
    await expect(getComputedStyle(nav).display).toBe("flex");
  },
};
