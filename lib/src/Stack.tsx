import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";
import type { Space } from "./space";

/* -------------------------------------------------------------------------------------------------
 * Stack
 * -----------------------------------------------------------------------------------------------*/

const STACK_NAME = "Stack";

/**
 * Cross-axis alignment of the children. For a column the cross axis is the
 * **inline** one, so this is horizontal — the same four keywords `Cluster` uses
 * for the vertical axis.
 *
 * The keyword is not the CSS value: `stack.css` maps `center` to `safe center`
 * and `end` to `safe flex-end`, so an over-wide child cannot be pushed past the
 * container's start edge and out of reach.
 */
const ALIGN = ["start", "center", "end", "stretch"] as const;

type StackAlign = (typeof ALIGN)[number];

/**
 * Every accepted `align`, at runtime.
 *
 * Nothing at the type level ties this list to `stack.css`, so a value added
 * here with no matching rule would typecheck and render an attribute that
 * matches nothing. A story asserts it against the selectors the stylesheet
 * emits, which is the only thing that catches it.
 */
const stackAligns: readonly StackAlign[] = ALIGN;

type StackElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface StackProps extends PrimitiveDivProps {
  /**
   * The gap between children, as a step on the space scale. **Required**: there
   * is no default and no opt-out. A layout that needs an off-scale value wants
   * its own flex container, not this one.
   */
  space: Space;
  /**
   * Cross-axis alignment, which for a column is horizontal. Defaults to
   * `stretch`, which is why a single inline-ish child — a `<button>` — comes out
   * full width; `align="start"` is the container-level answer,
   * `margin-inline: auto` on the child the other.
   */
  align?: StackAlign;
}

/**
 * Stack lays its children out in a column, spaced by a step on the space scale,
 * and never wraps.
 *
 * The appearance is `stack.css` — the `.el-stack` class and its `data-*`
 * vocabulary — so that stylesheet has to be loaded.
 *
 * That stylesheet zeroes its children's **block** margins, which is
 * load-bearing: flex adds a child's margin to the gap rather than collapsing
 * with it, so without the reset a `<p>` child would render `gap + 1em + 1em`.
 * `margin-inline` is untouched, so `margin-inline: auto` still centres.
 *
 * Container-only by design: no item-level attributes and no `Stack.Item`.
 */
const Stack = React.forwardRef<StackElement, StackProps>(
  ({ space, align, className, ...stackProps }, forwardedRef) => (
    <Primitive.div
      {...stackProps}
      ref={forwardedRef}
      className={cx("el-stack", className)}
      data-space={space}
      // Omitted rather than defaulted, so the class's own `stretch` stays the
      // single definition of the default.
      data-align={align}
    />
  ),
);

Stack.displayName = STACK_NAME;

export { Stack, stackAligns };
export type { StackAlign, StackProps };
