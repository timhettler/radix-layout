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

interface CoverRootProps extends PrimitiveDivProps {
  /** Gap, as a step on the space scale. Required. */
  space: Space;
}

/**
 * Cover is a column at least `--el-cover-min` tall (`100svh`) that holds one
 * `CoverCentered` in the middle of the space its siblings leave: a hero with a
 * header above and a footer below, either optional. Content taller than the
 * minimum grows the cover rather than overflowing it.
 *
 * Set `--el-cover-min` on a class of your own on the root. Padding of your own
 * adds to the minimum unless the root is `box-sizing: border-box`.
 *
 * Centres vertically only. To centre across, put a `Center` around the cover or
 * inside a part, or set `text-align`.
 *
 * Zeroes children's block margins, as `Stack` does; `margin-inline` is
 * untouched.
 */
const CoverRoot = React.forwardRef<CoverElement, CoverRootProps>(
  ({ space, className, ...rootProps }, forwardedRef) => (
    <Primitive.div
      {...rootProps}
      ref={forwardedRef}
      className={cx("el-cover", className)}
      data-space={space}
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
 * to the gap when the cover is full. Use one per cover; two share the space
 * between them.
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

export { CoverCentered, CoverRoot };
export type { CoverCenteredProps, CoverRootProps };
