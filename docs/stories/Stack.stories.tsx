import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Stack, spaces, stackAligns } from "@timhettler/radix-layout";

import { componentAttributeValues } from "../lib/stylesheets";

/**
 * A space step resolved to the px the browser will use.
 *
 * Not the declaration text: the defaults are `rem` and a consumer may remap
 * them to anything, while `getComputedStyle` always reports px. So the browser
 * does the conversion, through the same custom property the stylesheet reads.
 */
function resolvedGap(step: string) {
  const probe = document.createElement("div");
  probe.setAttribute(
    "style",
    `position: absolute; visibility: hidden; row-gap: var(--el-space-${step})`,
  );
  document.body.append(probe);
  const value = parseFloat(getComputedStyle(probe).rowGap);
  probe.remove();
  return value;
}

const rects = (node: Element) =>
  [...node.children].map((child) => child.getBoundingClientRect());

const sorted = (values: readonly string[]) => [...values].sort();

/** The values `stack.css` accepts for one `data-*` axis. */
const acceptedValues = (attribute: string) =>
  componentAttributeValues("el-stack", attribute);

function stackIn(root: HTMLElement, selector = ".el-stack") {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`No stack rendered for "${selector}"`);
  return node;
}

const meta = {
  title: "Layouts/Stack",
  component: Stack,
  parameters: { layout: "padded" },
  argTypes: {
    // Taken from the library, not restated — a restated list drifts.
    space: { control: "select", options: spaces },
    align: { control: "select", options: stackAligns },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    space: "4",
    children: (
      <>
        <h2>Notification settings</h2>
        <p>Choose how and when we get in touch.</p>
        <p>You can change these at any time.</p>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = stackIn(canvasElement);

    // The documented default element, and the attribute the required prop writes.
    await expect(node.tagName).toBe("DIV");
    await expect(node.getAttribute("data-space")).toBe("4");

    // `align` is *omitted* rather than defaulted, so `stack.css` stays the
    // single definition of the default.
    await expect(node.hasAttribute("data-align")).toBe(false);

    // One measurement, purely to prove the stylesheet arrived: nothing in the
    // build fails when the preview stops importing it.
    const [, first, second] = rects(node);
    await expect(second.top - first.bottom).toBeCloseTo(resolvedGap("4"), 1);
  },
};

/**
 * Every step on the space scale reaches its attribute, and every attribute has
 * a rule.
 *
 * The vocabulary equality is the point: a step added to `space.ts` with no
 * matching CSS rule typechecks, renders an attribute that matches nothing, and
 * falls back to no gap at all.
 */
export const Spacing: Story = {
  args: { space: "4" },
  render: () => (
    <div>
      {spaces.map((step) => (
        <div key={step} data-step={step} style={{ marginBlockEnd: "1.5rem" }}>
          <p>space=&quot;{step}&quot;</p>
          <Stack space={step}>
            <span>One</span>
            <span>Two</span>
          </Stack>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(sorted(acceptedValues("data-space"))).toEqual(sorted(spaces));

    for (const step of spaces) {
      const node = stackIn(canvasElement, `[data-step="${step}"] .el-stack`);
      const [first, second] = rects(node);
      await expect(second.top - first.bottom, step).toBeCloseTo(
        resolvedGap(step),
        1,
      );
    }
  },
};

/**
 * Cross-axis alignment, which for a column is horizontal — and the surprise it
 * exists to answer.
 *
 * `stretch` is the default, so a lone `<button>` in a Stack comes out full
 * width. `align="start"` is the container-level answer, and this story pins
 * both halves so neither can regress into the other.
 */
export const Alignment: Story = {
  args: { space: "3" },
  render: () => (
    <div>
      <div data-demo="stretch" style={{ marginBlockEnd: "1.5rem" }}>
        <Stack space="3">
          <button type="button">
            Full width, because stretch is the default
          </button>
        </Stack>
      </div>
      <div data-demo="start">
        <Stack space="3" align="start">
          <button type="button">Shrink-wrapped</button>
        </Stack>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(sorted(acceptedValues("data-align"))).toEqual(
      sorted(stackAligns),
    );

    const stretched = stackIn(canvasElement, '[data-demo="stretch"] .el-stack');
    const started = stackIn(canvasElement, '[data-demo="start"] .el-stack');
    await expect(started.getAttribute("data-align")).toBe("start");

    // The consequence, not just the attribute. Both stacks are the same width;
    // their children are not, and that difference *is* the axis. Asserting the
    // attribute alone would pass with the rule deleted from the stylesheet.
    const [stretchedChild] = rects(stretched);
    const [startedChild] = rects(started);
    await expect(stretchedChild.width).toBeCloseTo(
      stretched.getBoundingClientRect().width,
      0,
    );
    await expect(startedChild.width).toBeLessThan(stretchedChild.width);
  },
};

/**
 * The child margin reset, checked through real prose elements — the payload
 * that makes it necessary.
 *
 * These children arrive with live UA margins, and flex *adds* a child's margin
 * to the gap rather than collapsing with it. Without the reset in `stack.css`
 * this measures gap + margin + margin.
 */
export const ProseKeepsTheStep: Story = {
  args: { space: "2" },
  render: () => (
    <Stack space="2">
      <h2>A heading</h2>
      <p>The first paragraph.</p>
      <p>The second paragraph.</p>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const node = stackIn(canvasElement);
    const [heading, first, second] = rects(node);
    const expected = resolvedGap("2");

    // Both boundaries, because the UA gives them different margins — `h2` is
    // `0.83em` against a larger font, `p` is `1em`. A reset that reached only
    // one of them fails exactly one of these.
    await expect(first.top - heading.bottom, "h2 to p").toBeCloseTo(
      expected,
      1,
    );
    await expect(second.top - first.bottom, "p to p").toBeCloseTo(expected, 1);

    // And the margins really are being suppressed rather than absent: the same
    // element outside a stack still has one.
    const control = document.createElement("p");
    document.body.append(control);
    const controlMargin = parseFloat(
      getComputedStyle(control).marginBlockStart,
    );
    control.remove();
    await expect(controlMargin).toBeGreaterThan(0);
  },
};

/**
 * A consumer remaps the space scale from their own stylesheet, and it wins
 * whatever the load order.
 *
 * The rule is injected *before* every other stylesheet, at equal specificity
 * (`:root`), so if the defaults were unlayered the library's later `:root`
 * would win on source order and this would measure the default. It wins only
 * because the defaults sit in `@layer el.defaults` — ADR 0003 § 1.
 */
export const RemappedScale: Story = {
  args: { space: "4" },
  render: (args) => (
    <Stack {...args}>
      <span>One</span>
      <span>Two</span>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const override = document.createElement("style");
    override.textContent = ":root { --el-space-4: 50px; }";
    document.head.prepend(override);

    try {
      const [first, second] = rects(stackIn(canvasElement));
      await expect(second.top - first.bottom).toBeCloseTo(50, 1);
    } finally {
      override.remove();
    }
  },
};

/**
 * `asChild` collapses the layout onto the child element instead of wrapping
 * it, and a `ref` reaches the rendered element on both paths.
 */
export const Semantics: Story = {
  args: { space: "2" },
  render: function Render() {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      ref.current?.setAttribute("data-ref-attached", "");
    }, []);

    return (
      <div>
        <Stack asChild space="2">
          <ul
            className="settings"
            role="list"
            style={{ margin: 0, padding: 0, listStyle: "none" }}
          >
            <li>Email</li>
            <li>SMS</li>
            <li>Push</li>
          </ul>
        </Stack>
        <Stack asChild space="4">
          <nav aria-label="Section">
            <a href="#one">One</a>
            <a href="#two">Two</a>
          </nav>
        </Stack>
        <Stack ref={ref} space="2" className="extra" data-demo="classname">
          <span>One</span>
          <span>Two</span>
        </Stack>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // Merge direction on the component's *own* `className`, pinned as an exact
    // string. Under `asChild` the concatenation comes from Radix `Slot`, which
    // joins both sides whichever order we wrote them in — so only the
    // non-`asChild` path can show `cx()`'s arguments swapped.
    const withClass = stackIn(canvasElement, '[data-demo="classname"]');
    await expect(withClass.className).toBe("el-stack extra");

    // The forwarded ref reaches the default `div`.
    await expect(withClass.hasAttribute("data-ref-attached")).toBe(true);

    // And the `asChild` order: a component that spread the caller's `className`
    // after its own would overwrite `el-stack` and the layout would silently
    // do nothing.
    const list = stackIn(canvasElement, "ul");
    await expect(list.className).toBe("el-stack settings");
    await expect(list.getAttribute("data-space")).toBe("2");
    await expect(list.getAttribute("role")).toBe("list");

    // No wrapper survived: `asChild` renders the child, it does not nest it.
    await expect(list.parentElement?.classList.contains("el-stack")).toBe(
      false,
    );

    const nav = stackIn(canvasElement, "nav");
    await expect(nav.getAttribute("aria-label")).toBe("Section");
    await expect(nav.classList.contains("el-stack")).toBe(true);
    await expect(getComputedStyle(nav).flexDirection).toBe("column");
  },
};
