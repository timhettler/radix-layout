import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";
import type { Space } from "./space";

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
type CoverElement = React.ComponentRef<typeof Primitive.div>;

/* -------------------------------------------------------------------------------------------------
 * CoverRoot
 * -----------------------------------------------------------------------------------------------*/

const ROOT_NAME = "CoverRoot";

const MIN = ["screen"] as const;

type CoverMin = (typeof MIN)[number];

/** Every accepted `min`, at runtime. */
const coverMins: readonly CoverMin[] = MIN;

interface CoverRootProps extends PrimitiveDivProps {
  /** Gap, as a step on the space scale. Required. */
  space: Space;
  /** `screen` makes the cover at least the viewport's height (`100svh`). Omitted, there is no minimum. */
  min?: CoverMin;
}

/**
 * Cover is a column whose principal child takes the space its siblings leave:
 * a `CoverCentered` sits in the middle of it, a `CoverFill` grows into it. A
 * header above and a footer below are optional. Use one principal child per
 * cover.
 *
 * The space comes from a height of your own on the root, `min="screen"`, or
 * `--el-cover-min` set on a class of your own, such as
 * `calc(100svh - <header height>)`. Content taller than that grows the cover.
 * Padding of your own adds to the minimum unless the root is
 * `box-sizing: border-box`.
 *
 * Centres vertically only. To centre across, put a `Center` around the cover or
 * inside a part, or set `text-align`.
 *
 * Zeroes the block margins of every child but `CoverCentered`, as `Stack`
 * does; `margin-inline` is untouched.
 */
const CoverRoot = React.forwardRef<CoverElement, CoverRootProps>(
  ({ space, min, className, ...rootProps }, forwardedRef) => (
    <Primitive.div
      {...rootProps}
      ref={forwardedRef}
      className={cx("el-cover", className)}
      data-space={space}
      data-min={min}
    />
  ),
);

CoverRoot.displayName = ROOT_NAME;

/* -------------------------------------------------------------------------------------------------
 * CoverCentered
 * -----------------------------------------------------------------------------------------------*/

const CENTERED_NAME = "CoverCentered";

type CoverCenteredProps = PrimitiveDivProps;

/**
 * The principal child, kept in the middle by auto block margins, which give way
 * to the gap when the cover is full.
 */
const CoverCentered = React.forwardRef<CoverElement, CoverCenteredProps>(
  ({ className, ...centeredProps }, forwardedRef) => (
    <Primitive.div
      {...centeredProps}
      ref={forwardedRef}
      className={cx("el-cover__centered", className)}
    />
  ),
);

CoverCentered.displayName = CENTERED_NAME;

/* -------------------------------------------------------------------------------------------------
 * CoverFill
 * -----------------------------------------------------------------------------------------------*/

const FILL_NAME = "CoverFill";

type CoverFillProps = PrimitiveDivProps;

/**
 * The principal child, grown to take the space its siblings leave: the body
 * between a page's header and footer. In a cover of fixed height it shrinks
 * rather than pushing the footer out; add `overflow` on a class of your own to
 * scroll or clip what doesn't fit.
 */
const CoverFill = React.forwardRef<CoverElement, CoverFillProps>(
  ({ className, ...fillProps }, forwardedRef) => (
    <Primitive.div
      {...fillProps}
      ref={forwardedRef}
      className={cx("el-cover__fill", className)}
    />
  ),
);

CoverFill.displayName = FILL_NAME;

export { CoverCentered, CoverFill, CoverRoot, coverMins };
export type { CoverCenteredProps, CoverFillProps, CoverMin, CoverRootProps };
