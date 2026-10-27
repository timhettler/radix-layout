import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Frame, frameRatios } from "@timhettler/radix-layout";
import type { FrameRatio } from "@timhettler/radix-layout";

import { componentAttributeValues } from "../lib/stylesheets";

function nodeIn(root: Element, selector = ".el-frame") {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Nothing rendered for "${selector}"`);
  return node;
}

/** Prepends `css` before every sheet, so it wins only where the defaults are layered (ADR 0003 § 1). */
function prepend(css: string) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.prepend(style);
  return () => style.remove();
}

/** Appends `css` after every sheet, so it wins any tie on specificity. */
function append(css: string) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  return () => style.remove();
}

/** Above the browsers' layout units (1/64px, or 1/60px in Firefox). */
const NEAR = 0.5;

/** Width over height, from the `aspect-ratio` keyword spelling. */
const quotient = (ratio: FrameRatio) => {
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
};

/** An SVG of the given size, so its intrinsic ratio differs from the frame's. */
const source = (width: number, height: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="teal"/><circle cx="50%" cy="50%" r="${height / 3}" fill="gold"/></svg>`,
  )}`;

const WIDE = source(240, 90);

/** A bitmap contributes no layout until it decodes. */
const decoded = (root: Element) =>
  Promise.all([...root.querySelectorAll("img")].map((img) => img.decode()));

const column: React.CSSProperties = { inlineSize: "20rem" };

const ratioOf = (node: Element) => {
  const { width, height } = node.getBoundingClientRect();
  return width / height;
};

const meta = {
  title: "Layouts/Frame",
  component: Frame,
  decorators: [
    (Story) => (
      <div style={column}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    // Taken from the library, not restated — a restated list drifts.
    ratio: { control: "select", options: frameRatios },
  },
} satisfies Meta<typeof Frame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Without `ratio`, 16:9, and the image fills it. */
export const Default: Story = {
  args: { children: <img src={WIDE} alt="A gold circle on teal" /> },
  play: async ({ canvasElement }) => {
    await decoded(canvasElement);
    const node = nodeIn(canvasElement);

    await expect(node.tagName).toBe("DIV");
    await expect(node.hasAttribute("data-ratio")).toBe(false);

    const style = getComputedStyle(node);
    await expect(style.display).toBe("flex");
    await expect(style.overflow).toBe("hidden");

    const box = node.getBoundingClientRect();
    await expect(box.width).toBeCloseTo(
      nodeIn(canvasElement, "div").getBoundingClientRect().width,
      1,
    );
    await expect(box.height).toBeCloseTo((box.width * 9) / 16, 0);
  },
};

/** Every named ratio has a rule and gives its shape. */
export const Ratios: Story = {
  render: () => (
    <div>
      {frameRatios.map((ratio) => (
        <Frame key={ratio} ratio={ratio} data-demo={ratio}>
          <img src={WIDE} alt="" />
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await decoded(canvasElement);
    await expect(
      [...componentAttributeValues("el-frame", "data-ratio")].sort(),
    ).toEqual([...frameRatios].sort());

    for (const ratio of frameRatios) {
      const node = nodeIn(canvasElement, `[data-demo="${ratio}"]`);
      await expect(ratioOf(node), ratio).toBeCloseTo(quotient(ratio), 2);
    }
  },
};

/**
 * Each kind of media child fills the frame, cropped rather than distorted,
 * even under a reset loaded after the library at a higher specificity.
 */
export const CropsMedia: Story = {
  render: () => (
    <div className="prose">
      <Frame ratio="1:1" data-demo="img">
        <img src={WIDE} alt="A gold circle on teal" />
      </Frame>
      <Frame ratio="1:1" data-demo="picture">
        <picture>
          <img src={WIDE} alt="A gold circle on teal" />
        </picture>
      </Frame>
      <Frame ratio="1:1" data-demo="video">
        <video muted />
      </Frame>
      <Frame ratio="1:1" data-demo="iframe">
        <iframe title="An embed" srcDoc="<p>Embedded</p>" />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await decoded(canvasElement);
    const restore = append(
      ".prose img, .prose video, .prose iframe { block-size: auto; max-inline-size: 100%; max-block-size: 100%; }",
    );
    try {
      for (const kind of ["img", "picture", "video", "iframe"]) {
        const node = nodeIn(canvasElement, `[data-demo="${kind}"]`);
        const frame = node.getBoundingClientRect();
        const media = nodeIn(node, kind === "picture" ? "img" : kind);
        const box = media.getBoundingClientRect();

        await expect(Math.abs(box.width - frame.width), kind).toBeLessThan(
          NEAR,
        );
        await expect(Math.abs(box.height - frame.height), kind).toBeLessThan(
          NEAR,
        );
      }

      const img = nodeIn(canvasElement, '[data-demo="img"] img');
      await expect(getComputedStyle(img).objectFit).toBe("cover");
    } finally {
      restore();
    }
  },
};

/** A letterbox is an override the frame allows: object-fit isn't forced. */
export const Letterbox: Story = {
  args: {
    children: <img className="letterbox" src={WIDE} alt="" />,
  },
  play: async ({ canvasElement }) => {
    await decoded(canvasElement);
    const restore = append(".el-frame > .letterbox { object-fit: contain; }");
    try {
      const img = nodeIn(canvasElement, "img");
      await expect(getComputedStyle(img).objectFit).toBe("contain");
    } finally {
      restore();
    }
  },
};

/** Content taller than the frame is centred and clipped; it doesn't grow the frame. */
export const CropsContent: Story = {
  args: {
    children: (
      <p data-part="content" style={{ margin: 0, blockSize: "30rem" }}>
        Image pending
      </p>
    ),
  },
  play: async ({ canvasElement }) => {
    const node = nodeIn(canvasElement);
    const frame = node.getBoundingClientRect();
    const content = nodeIn(
      node,
      '[data-part="content"]',
    ).getBoundingClientRect();

    await expect(frame.height).toBeCloseTo((frame.width * 9) / 16, 0);
    await expect(content.height).toBeGreaterThan(frame.height);
    await expect(
      Math.abs(frame.top - content.top - (content.bottom - frame.bottom)),
    ).toBeLessThan(NEAR);
    await expect(
      document.elementFromPoint(frame.left + 1, frame.bottom + 1),
    ).not.toBe(nodeIn(node, '[data-part="content"]'));
  },
};

/**
 * `--el-frame-ratio` on a class of your own beats `ratio` whatever the load
 * order. An invalid value loses only the shape.
 */
export const Knob: Story = {
  render: () => (
    <div>
      <Frame ratio="1:1" className="story-frame" data-demo="class">
        <img src={WIDE} alt="" />
      </Frame>
      <Frame className="story-invalid" data-demo="invalid">
        <div style={{ blockSize: "3rem" }} />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await decoded(canvasElement);
    const restore = prepend(
      ".story-frame { --el-frame-ratio: 3 / 2; } .story-invalid { --el-frame-ratio: wide; }",
    );
    try {
      await expect(
        ratioOf(nodeIn(canvasElement, '[data-demo="class"]')),
      ).toBeCloseTo(3 / 2, 2);

      const invalid = nodeIn(canvasElement, '[data-demo="invalid"]');
      await expect(getComputedStyle(invalid).aspectRatio).toBe("auto");
      await expect(invalid.getBoundingClientRect().height).toBeCloseTo(
        nodeIn(invalid, "div").getBoundingClientRect().height,
        1,
      );
    } finally {
      restore();
    }
  },
};

/** On an image itself, the frame is one element that fills the column and crops its own source. */
export const AsChild: Story = {
  args: {
    asChild: true,
    ratio: "1:1",
    children: <img className="own" src={WIDE} alt="A gold circle on teal" />,
  },
  play: async ({ canvasElement }) => {
    await decoded(canvasElement);
    const node = nodeIn(canvasElement);

    await expect(node.tagName).toBe("IMG");
    await expect(node.classList.contains("own")).toBe(true);
    await expect(node.getAttribute("data-ratio")).toBe("1:1");
    await expect(getComputedStyle(node).objectFit).toBe("cover");
    await expect(node.getBoundingClientRect().width).toBeCloseTo(
      nodeIn(canvasElement, "div").getBoundingClientRect().width,
      1,
    );
    await expect(ratioOf(node)).toBeCloseTo(1, 2);
  },
};
