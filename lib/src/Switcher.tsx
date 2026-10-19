import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";
import type { Space } from "./space";

/* -------------------------------------------------------------------------------------------------
 * Switcher
 * -----------------------------------------------------------------------------------------------*/

const SWITCHER_NAME = "Switcher";

const MIN = ["s", "m", "l"] as const;

type SwitcherMin = (typeof MIN)[number];

/** Every accepted `min`, at runtime. */
const switcherMins: readonly SwitcherMin[] = MIN;

type SwitcherElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface SwitcherProps extends PrimitiveDivProps {
  /** Gap, as a step on the space scale. Required. */
  space: Space;
  /** The narrowest a child may be before every child stacks: `s` 10rem, `m` 15rem, `l` 20rem. Defaults to `m`. */
  min?: SwitcherMin;
}

/**
 * Switcher lays its children out in one row of equal widths, and stacks every
 * child at once when any would be narrower than `min`. The switch comes from
 * the space the switcher is given, not the viewport.
 *
 * Every child counts toward the threshold, including one hidden with
 * `display: none`; render a child conditionally to remove it.
 *
 * A child's content never sizes it: content wider than its share overflows,
 * and a larger `min` is the fix. Each child is an inline-size query container.
 *
 * Zeroes children's margins on both axes.
 *
 * No item-level API.
 */
const Switcher = React.forwardRef<SwitcherElement, SwitcherProps>(
  ({ space, min, className, ...switcherProps }, forwardedRef) => (
    <Primitive.div
      {...switcherProps}
      ref={forwardedRef}
      className={cx("el-switcher", className)}
      data-space={space}
      data-min={min}
    />
  ),
);

Switcher.displayName = SWITCHER_NAME;

export { Switcher, switcherMins };
export type { SwitcherMin, SwitcherProps };
