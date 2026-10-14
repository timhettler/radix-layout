import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";
import type { Space } from "./space";

/* -------------------------------------------------------------------------------------------------
 * Stack
 * -----------------------------------------------------------------------------------------------*/

const STACK_NAME = "Stack";

const ALIGN = ["start", "center", "end", "stretch"] as const;

type StackAlign = (typeof ALIGN)[number];

/** Every accepted `align`, at runtime. */
const stackAligns: readonly StackAlign[] = ALIGN;

type StackElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface StackProps extends PrimitiveDivProps {
  /** Gap, as a step on the space scale. Required. */
  space: Space;
  /** Cross-axis (horizontal) alignment. Defaults to `stretch`, so a lone button goes full width; use `start`. */
  align?: StackAlign;
}

/**
 * Stack lays its children out in a column, spaced by a step on the space scale,
 * and never wraps.
 *
 * Zeroes children's block margins; `margin-inline` is untouched.
 *
 * No item-level API.
 */
const Stack = React.forwardRef<StackElement, StackProps>(
  ({ space, align, className, ...stackProps }, forwardedRef) => (
    <Primitive.div
      {...stackProps}
      ref={forwardedRef}
      className={cx("el-stack", className)}
      data-space={space}
      data-align={align}
    />
  ),
);

Stack.displayName = STACK_NAME;

export { Stack, stackAligns };
export type { StackAlign, StackProps };
