import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";

type BleedElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;

/* -------------------------------------------------------------------------------------------------
 * BleedBoundary
 * -----------------------------------------------------------------------------------------------*/

const BOUNDARY_NAME = "BleedBoundary";

type BleedBoundaryProps = PrimitiveDivProps;

/**
 * BleedBoundary sets the edges a `Bleed` inside it reaches. Put it once around
 * a page, or around a region narrower than the page, and wrap the column
 * rather than merging onto it with `asChild`: a bleed reaches the boundary's
 * content box, which for a merged column is the column.
 *
 * It is an inline-size query container, so fluid space steps inside it resolve
 * against it, and it needs a width from its parent: in a content-sized slot,
 * such as a `Cluster` child, it collapses.
 *
 * Set `--el-bleed-max` to a length on a class of your own to cap every bleed
 * inside, centred on the boundary.
 */
const BleedBoundary = React.forwardRef<BleedElement, BleedBoundaryProps>(
  ({ className, ...boundaryProps }, forwardedRef) => (
    <Primitive.div
      {...boundaryProps}
      ref={forwardedRef}
      className={cx("el-bleed-boundary", className)}
    />
  ),
);

BleedBoundary.displayName = BOUNDARY_NAME;

/* -------------------------------------------------------------------------------------------------
 * Bleed
 * -----------------------------------------------------------------------------------------------*/

const BLEED_NAME = "Bleed";

type BleedProps = PrimitiveDivProps;

/**
 * Bleed reaches the edges of the nearest `BleedBoundary` above it, at any
 * depth, from inside a centred column: a hero image or a full-width band in an
 * article. Outside a boundary it is its parent's width.
 *
 * Its parent must be centred in the boundary, as a `Center` is, or a `Stack`
 * merged onto one. In a `Cluster`, `Switcher` or `Sidebar` child, their margin
 * reset cancels the bleed.
 *
 * For HTML you don't author, include the same rule on your own selector:
 * `@include el.bleed` from `pkg:@timhettler/radix-layout/mixins`.
 *
 * Sets its inline margins and width; padding of your own stays inside it.
 */
const Bleed = React.forwardRef<BleedElement, BleedProps>(
  ({ className, ...bleedProps }, forwardedRef) => (
    <Primitive.div
      {...bleedProps}
      ref={forwardedRef}
      className={cx("el-bleed", className)}
    />
  ),
);

Bleed.displayName = BLEED_NAME;

export { Bleed, BleedBoundary };
export type { BleedBoundaryProps, BleedProps };
