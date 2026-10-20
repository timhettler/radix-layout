import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";
import type { Space } from "./space";

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
type SidebarElement = React.ComponentRef<typeof Primitive.div>;

/* -------------------------------------------------------------------------------------------------
 * SidebarRoot
 * -----------------------------------------------------------------------------------------------*/

const ROOT_NAME = "SidebarRoot";

const ALIGN = ["start", "center", "end", "stretch"] as const;

type SidebarAlign = (typeof ALIGN)[number];

/** Every accepted `align`, at runtime. */
const sidebarAligns: readonly SidebarAlign[] = ALIGN;

interface SidebarRootProps extends PrimitiveDivProps {
  /** Gap, as a step on the space scale. Required. */
  space: Space;
  /** Cross-axis alignment of the two parts. Defaults to `stretch`, so both are the height of the taller. */
  align?: SidebarAlign;
}

/**
 * Sidebar lays out two unequal parts side by side, such as an image beside
 * its text (the media object), a filter panel beside results, or a button
 * beside its input. They stack when the content would be narrower than its
 * minimum share of the row, so the switch follows the space the sidebar is
 * given, not the viewport.
 *
 * Holds one `SidebarSide` and one `SidebarContent`, in reading order. The side
 * is its content's width unless `--el-sidebar-side-width` sets one, and the
 * pair stacks when the content would be under `--el-sidebar-content-min`
 * (`50%`). Set either on a class of your own on the root or on the part.
 *
 * With `asChild` onto an `img`, the default `stretch` distorts it: wrap the
 * image, or use `align="start"`.
 *
 * Zeroes children's margins on both axes.
 */
const SidebarRoot = React.forwardRef<SidebarElement, SidebarRootProps>(
  ({ space, align, className, ...rootProps }, forwardedRef) => (
    <Primitive.div
      {...rootProps}
      ref={forwardedRef}
      className={cx("el-sidebar", className)}
      data-space={space}
      data-align={align}
    />
  ),
);

SidebarRoot.displayName = ROOT_NAME;

/* -------------------------------------------------------------------------------------------------
 * SidebarSide
 * -----------------------------------------------------------------------------------------------*/

const SIDE_NAME = "SidebarSide";

type SidebarSideProps = PrimitiveDivProps;

/**
 * The narrower part. Its width is `--el-sidebar-side-width`, or its content's
 * when that is `auto`, which suits an image or a button; a side of running
 * text needs a length. Stacked, it fills its line.
 */
const SidebarSide = React.forwardRef<SidebarElement, SidebarSideProps>(
  ({ className, ...sideProps }, forwardedRef) => (
    <Primitive.div
      {...sideProps}
      ref={forwardedRef}
      className={cx("el-sidebar__side", className)}
    />
  ),
);

SidebarSide.displayName = SIDE_NAME;

/* -------------------------------------------------------------------------------------------------
 * SidebarContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "SidebarContent";

type SidebarContentProps = PrimitiveDivProps;

/**
 * The main part, which takes the rest of the row. Content wider than it
 * overflows it rather than pushing the side. Not a query container; add
 * `container-type` on a class of your own.
 */
const SidebarContent = React.forwardRef<SidebarElement, SidebarContentProps>(
  ({ className, ...contentProps }, forwardedRef) => (
    <Primitive.div
      {...contentProps}
      ref={forwardedRef}
      className={cx("el-sidebar__content", className)}
    />
  ),
);

SidebarContent.displayName = CONTENT_NAME;

export { SidebarContent, SidebarRoot, SidebarSide, sidebarAligns };
export type {
  SidebarAlign,
  SidebarContentProps,
  SidebarRootProps,
  SidebarSideProps,
};
