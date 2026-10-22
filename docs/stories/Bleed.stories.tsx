import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  Bleed,
  BleedBoundary,
  Center,
  Stack,
  spaces,
} from "@timhettler/radix-layout";

import { registeredProperty } from "../lib/stylesheets";
import bleedMixin from "./fixtures/bleed-mixin.scss?inline";
import mixinsEntry from "./fixtures/mixins-entry.scss?inline";

function nodeIn(root: Element, selector: string) {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Nothing rendered for "${selector}"`);
  return node;
}

/** A length in px, resolved inside `parent`. */
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

const setWidth = (frame: HTMLElement, px: number) => {
  frame.style.inlineSize = `${px}px`;
};

/** Prepends `css` before every sheet, so it wins only where the defaults are layered (ADR 0003 § 1). */
function prepend(css: string) {
  const override = document.createElement("style");
  override.textContent = css;
  document.head.prepend(override);
  return () => override.remove();
}

/** The content box, inside padding and left of a classic scrollbar. Exact while the frame's width is whole pixels. */
function contentBoxOf(node: HTMLElement) {
  const style = getComputedStyle(node);
  const start = parseFloat(style.paddingInlineStart);
  const end = parseFloat(style.paddingInlineEnd);
  const left = node.getBoundingClientRect().left + node.clientLeft + start;
  return { left, right: left + node.clientWidth - start - end };
}

async function expectSpans(bleed: Element, boundary: HTMLElement, label = "") {
  const box = contentBoxOf(boundary);
  const rect = bleed.getBoundingClientRect();
  await expect(rect.left, `${label} left`).toBeCloseTo(box.left, 1);
  await expect(rect.right, `${label} right`).toBeCloseTo(box.right, 1);
}

async function expectNoOverflow(scroller: HTMLElement, label = "") {
  await expect(scroller.scrollWidth, label).toBeLessThanOrEqual(
    scroller.clientWidth,
  );
}

/** A classic scrollbar takes layout width; an overlay one would make the overflow checks vacuous. */
async function expectClassicScrollbar(scroller: HTMLElement) {
  await expect(scroller.offsetWidth - scroller.clientWidth).toBeGreaterThan(0);
}

const WIDE = 1200;
const MID = 700;
const NARROW = 300;
const WIDTHS = [WIDE, MID, NARROW];

/** Scrolls on the block axis; `::-webkit-scrollbar` keeps its scrollbar classic in Chromium and WebKit. */
const scrollerCss = `
  .scroller { overflow-y: scroll; block-size: 16rem; }
  .scroller::-webkit-scrollbar { width: 16px; }
  .scroller::-webkit-scrollbar-thumb { background: #767676; }
`;

// A scrolling region must be reachable from the keyboard.
const scrollerProps = {
  role: "region",
  "aria-label": "Page",
  tabIndex: 0,
} as const;

const band = { background: "#e8e8e8" };

const prose =
  "A centred column holds running text to a readable measure, and a bleed inside it reaches the edges of the boundary around the page.";

const meta = {
  title: "Layouts/Bleed",
  component: Bleed,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Bleed>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The page shape: a boundary inside the scrolling element, with a classic
 * scrollbar showing. A bleed in a centred column spans the boundary at every
 * width and gutter, and nothing scrolls sideways.
 */
export const Default: Story = {
  render: () => (
    <>
      <style>{scrollerCss}</style>
      <div className="scroller" data-scroller="" {...scrollerProps}>
        <BleedBoundary data-boundary="">
          {spaces.map((step) => (
            <Center key={step} gutter={step} data-step={step}>
              <p>{prose}</p>
              <Bleed style={band}>
                <p>gutter=&quot;{step}&quot;</p>
              </Bleed>
            </Center>
          ))}
        </BleedBoundary>
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(registeredProperty("--el-bleed-width")).toEqual({
      values: ["<length-percentage>"],
      initial: "100%",
    });

    const scroller = nodeIn(canvasElement, "[data-scroller]");
    const boundary = nodeIn(canvasElement, "[data-boundary]");
    await expectClassicScrollbar(scroller);

    for (const width of WIDTHS) {
      setWidth(scroller, width);
      for (const step of spaces) {
        const bleed = nodeIn(boundary, `[data-step="${step}"] > .el-bleed`);
        await expectSpans(bleed, boundary, `${width}px ${step}`);
      }
      await expectNoOverflow(scroller, `${width}px`);
    }
  },
};

/** The boundary can be the scrolling element itself; its scrollbar is outside its content box. */
export const ScrollingBoundary: Story = {
  render: () => (
    <>
      <style>{scrollerCss}</style>
      <BleedBoundary className="scroller" data-boundary="" {...scrollerProps}>
        <Center gutter="m">
          <p>{prose}</p>
          <Bleed style={band}>
            <p>Full width.</p>
          </Bleed>
          <p>{prose}</p>
          <p>{prose}</p>
        </Center>
      </BleedBoundary>
    </>
  ),
  play: async ({ canvasElement }) => {
    const boundary = nodeIn(canvasElement, "[data-boundary]");
    await expectClassicScrollbar(boundary);

    for (const width of WIDTHS) {
      setWidth(boundary, width);
      await expectSpans(nodeIn(boundary, ".el-bleed"), boundary, `${width}px`);
      await expectNoOverflow(boundary, `${width}px`);
    }
  },
};

/**
 * The width is computed against the boundary and inherited, so containers
 * between them, the column included, don't change what the bleed reaches.
 */
export const ContainerBetween: Story = {
  render: () => (
    <div data-frame="">
      <BleedBoundary data-boundary="">
        <div style={{ containerType: "inline-size" }}>
          <Center gutter="m" style={{ containerType: "inline-size" }}>
            <p>{prose}</p>
            <Bleed style={band}>
              <p>Full width.</p>
            </Bleed>
          </Center>
        </div>
      </BleedBoundary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const boundary = nodeIn(frame, "[data-boundary]");

    for (const width of [WIDE, NARROW]) {
      setWidth(frame, width);
      await expectSpans(nodeIn(boundary, ".el-bleed"), boundary, `${width}px`);
    }
  },
};

/** A column merged onto a stack, whether it stretches its children or centres them. */
export const InAStack: Story = {
  render: () => (
    <div data-frame="">
      <BleedBoundary data-boundary="">
        {(["stretch", "center"] as const).map((align) => (
          <Center key={align} asChild gutter="m">
            <Stack space="m" align={align} data-align-demo={align}>
              <p>{prose}</p>
              <Bleed style={band}>
                <p>align=&quot;{align}&quot;</p>
              </Bleed>
            </Stack>
          </Center>
        ))}
      </BleedBoundary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const boundary = nodeIn(frame, "[data-boundary]");

    for (const width of [WIDE, NARROW]) {
      setWidth(frame, width);
      for (const align of ["stretch", "center"]) {
        const bleed = nodeIn(
          boundary,
          `[data-align-demo="${align}"] > .el-bleed`,
        );
        await expectSpans(bleed, boundary, `${width}px ${align}`);
      }
    }
  },
};

/**
 * Parents that centre without `safe` read both margins, so the bleed's end
 * margin is what keeps it on the boundary.
 */
export const CentringParents: Story = {
  render: () => (
    <div data-frame="">
      <BleedBoundary data-boundary="">
        <Center gutter="m">
          <div
            data-parent="grid"
            style={{ display: "grid", justifyItems: "center" }}
          >
            <Bleed style={band}>
              <p>justify-items: center</p>
            </Bleed>
          </div>
          <div
            data-parent="flex"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Bleed style={band}>
              <p>align-items: center</p>
            </Bleed>
          </div>
        </Center>
      </BleedBoundary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const boundary = nodeIn(frame, "[data-boundary]");

    for (const width of [WIDE, NARROW]) {
      setWidth(frame, width);
      for (const parent of ["grid", "flex"]) {
        const bleed = nodeIn(boundary, `[data-parent="${parent}"] > .el-bleed`);
        await expectSpans(bleed, boundary, `${width}px ${parent}`);
      }
    }
  },
};

const picture = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#bbb"/></svg>',
)}`;

/** An image made the bleed spans the boundary under a product's `max-width: 100%` reset. */
export const Image: Story = {
  render: () => (
    <div data-frame="">
      <BleedBoundary data-boundary="">
        <Center gutter="m">
          <p>{prose}</p>
          <Bleed asChild>
            <img src={picture} alt="A grey placeholder" />
          </Bleed>
        </Center>
      </BleedBoundary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend("img { max-width: 100%; height: auto; }");

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const boundary = nodeIn(frame, "[data-boundary]");
      const image = nodeIn(boundary, "img");
      await expect(image.classList.contains("el-bleed")).toBe(true);

      for (const width of [WIDE, NARROW]) {
        setWidth(frame, width);
        await expectSpans(image, boundary, `${width}px`);
      }
    } finally {
      restore();
    }
  },
};

/** Padding of your own stays inside the bleed, so a padded band doesn't overflow. */
export const PaddedBand: Story = {
  render: () => (
    <>
      <style>{scrollerCss}</style>
      <div className="scroller" data-scroller="" {...scrollerProps}>
        <BleedBoundary data-boundary="">
          <Center gutter="m">
            <p>{prose}</p>
            <Bleed className="band" style={band}>
              <p>A band with its own inset.</p>
            </Bleed>
          </Center>
        </BleedBoundary>
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(".band { padding-inline: 2rem; }");

    try {
      const scroller = nodeIn(canvasElement, "[data-scroller]");
      const boundary = nodeIn(scroller, "[data-boundary]");
      const bleed = nodeIn(boundary, ".band");
      await expect(parseFloat(getComputedStyle(bleed).paddingInlineStart)).toBe(
        resolvedLength(bleed, "2rem"),
      );

      for (const width of [WIDE, NARROW]) {
        setWidth(scroller, width);
        await expectSpans(bleed, boundary, `${width}px`);
        await expectNoOverflow(scroller, `${width}px`);
      }
    } finally {
      restore();
    }
  },
};

/**
 * `--el-bleed-max` on the boundary caps every bleed inside it, centred on the
 * boundary, and wins whatever the load order.
 */
export const Capped: Story = {
  render: () => (
    <div data-frame="">
      <BleedBoundary className="page" data-boundary="">
        <Center gutter="m">
          <p>{prose}</p>
          <Bleed style={band}>
            <p>Capped.</p>
          </Bleed>
        </Center>
      </BleedBoundary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(".page { --el-bleed-max: 30rem; }");

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const boundary = nodeIn(frame, "[data-boundary]");
      const bleed = nodeIn(boundary, ".el-bleed");
      const cap = resolvedLength(boundary, "30rem");

      setWidth(frame, WIDE);
      const box = contentBoxOf(boundary);
      const rect = bleed.getBoundingClientRect();
      await expect(rect.width).toBeCloseTo(cap, 1);
      await expect(rect.left - box.left).toBeCloseTo(box.right - rect.right, 1);

      setWidth(frame, NARROW);
      await expectSpans(bleed, boundary, "narrow");
    } finally {
      restore();
    }
  },
};

/**
 * A boundary inside another sets its own edges, and its own cap: the inner
 * bleed reaches the inner boundary, and the outer cap doesn't reach it.
 */
export const NestedBoundary: Story = {
  render: () => (
    <div data-frame="">
      <BleedBoundary className="page" data-boundary="outer">
        <Center className="wide" gutter="m">
          <p>{prose}</p>
          <BleedBoundary data-boundary="inner">
            <Center gutter="s">
              <p>{prose}</p>
              <Bleed style={band}>
                <p>Reaches the inner boundary.</p>
              </Bleed>
            </Center>
          </BleedBoundary>
        </Center>
      </BleedBoundary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = prepend(
      ".page { --el-bleed-max: 30rem; } .wide { --el-center-max: 50rem; }",
    );

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const inner = nodeIn(frame, '[data-boundary="inner"]');
      setWidth(frame, WIDE);

      // Wider than the outer cap, so an inherited cap would show.
      await expect(inner.clientWidth).toBeGreaterThan(
        resolvedLength(inner, "30rem"),
      );
      await expectSpans(nodeIn(inner, ".el-bleed"), inner);
    } finally {
      restore();
    }
  },
};

/** Outside any boundary, a bleed is its parent's width. */
export const OutsideABoundary: Story = {
  render: () => (
    <div data-frame="">
      <Center gutter="m" data-column="">
        <p>{prose}</p>
        <Bleed style={band}>
          <p>Inert.</p>
        </Bleed>
      </Center>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = nodeIn(canvasElement, "[data-frame]");
    const column = nodeIn(frame, "[data-column]");
    const bleed = nodeIn(column, ".el-bleed");
    setWidth(frame, WIDE);

    const style = getComputedStyle(bleed);
    await expect(style.getPropertyValue("--el-bleed-width").trim()).toBe(
      "100%",
    );
    await expect(parseFloat(style.marginInlineStart)).toBe(0);
    await expect(parseFloat(style.marginInlineEnd)).toBe(0);

    // The column's width is fractional, so this reads its border box, not clientWidth.
    const outer = column.getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(column).paddingInlineStart);
    const rect = bleed.getBoundingClientRect();
    await expect(rect.left).toBeCloseTo(outer.left + padding, 1);
    await expect(rect.right).toBeCloseTo(outer.right - padding, 1);
  },
};

/**
 * HTML you don't author, such as CMS output, takes the same rule through the
 * `bleed` mixin on your own selector, and lands where a `Bleed` does.
 */
export const Mixin: Story = {
  render: () => (
    <div data-frame="">
      <BleedBoundary data-boundary="">
        <Center gutter="m">
          <div
            className="cms"
            dangerouslySetInnerHTML={{
              __html: `<p>${prose}</p><figure class="alignfull"><p>From the CMS.</p></figure>`,
            }}
          />
          <Bleed style={band}>
            <p>From JSX.</p>
          </Bleed>
        </Center>
      </BleedBoundary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(mixinsEntry.trim()).toBe("");

    const sheet = document.createElement("style");
    sheet.textContent = bleedMixin;
    document.head.append(sheet);

    try {
      const frame = nodeIn(canvasElement, "[data-frame]");
      const boundary = nodeIn(frame, "[data-boundary]");
      const figure = nodeIn(boundary, ".alignfull");
      const bleed = nodeIn(boundary, ".el-bleed");

      for (const width of [WIDE, NARROW]) {
        setWidth(frame, width);
        await expectSpans(figure, boundary, `${width}px figure`);
        await expectSpans(bleed, boundary, `${width}px bleed`);
      }
    } finally {
      sheet.remove();
    }
  },
};

/** The boundary isn't a containing block for fixed-position descendants, so a dialog or toast inside it stays on the viewport. */
export const FixedChild: Story = {
  render: () => (
    <div style={{ marginInlineStart: "3rem", marginBlockStart: "3rem" }}>
      <BleedBoundary>
        <div
          data-fixed=""
          style={{
            position: "fixed",
            insetInlineStart: 0,
            insetBlockStart: 0,
            inlineSize: "1rem",
            blockSize: "1rem",
          }}
        />
      </BleedBoundary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rect = nodeIn(canvasElement, "[data-fixed]").getBoundingClientRect();
    await expect(rect.left).toBe(0);
    await expect(rect.top).toBe(0);
  },
};

/**
 * `asChild` makes either component your element, merging onto it rather than
 * wrapping it, and a `ref` reaches the rendered element.
 */
export const Semantics: Story = {
  render: function Render() {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      ref.current?.setAttribute("data-ref-attached", "");
    }, []);

    return (
      <BleedBoundary asChild>
        <main className="page">
          <Center gutter="m">
            <Bleed asChild>
              <figure className="hero">
                <figcaption>{prose}</figcaption>
              </figure>
            </Bleed>
            <Bleed ref={ref} className="extra" data-demo="classname">
              <p>{prose}</p>
            </Bleed>
          </Center>
        </main>
      </BleedBoundary>
    );
  },
  play: async ({ canvasElement }) => {
    const main = nodeIn(canvasElement, "main");
    // Slot-first is Radix's order; this pins it, not cx().
    await expect(main.className).toBe("el-bleed-boundary page");
    await expect(
      main.parentElement?.classList.contains("el-bleed-boundary"),
    ).toBe(false);

    const figure = nodeIn(main, "figure");
    await expect(figure.className).toBe("el-bleed hero");
    await expect(figure.parentElement?.classList.contains("el-center")).toBe(
      true,
    );

    const withClass = nodeIn(main, '[data-demo="classname"]');
    await expect(withClass.className).toBe("el-bleed extra");
    await expect(withClass.hasAttribute("data-ref-attached")).toBe(true);
  },
};
