import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";

/* -------------------------------------------------------------------------------------------------
 * Frame
 * -----------------------------------------------------------------------------------------------*/

const FRAME_NAME = "Frame";

const RATIO = ["1:1", "16:9", "4:5"] as const;

type FrameRatio = (typeof RATIO)[number];

/** Every accepted `ratio`, at runtime. */
const frameRatios: readonly FrameRatio[] = RATIO;

type FrameElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface FrameProps extends PrimitiveDivProps {
  /** Width to height. Defaults to `16:9`; for any other, set `--el-frame-ratio`. */
  ratio?: FrameRatio;
}

/**
 * Frame is a window of a fixed aspect ratio onto its content: it fills the
 * inline space it's given, takes its height from the ratio, and crops what
 * doesn't fit.
 *
 * A child `img`, `video`, `iframe` or `picture` fills the frame and is cropped
 * by `object-fit: cover`; set `object-position` on it to move the focal point.
 * Any other child is centred and clipped where it's taller than the frame; a
 * `min-inline-size` over `100%` crops it across.
 *
 * Set `--el-frame-ratio` (`3 / 2`) on a class of your own for a ratio off the
 * list, or to change it in a media query.
 *
 * Give the frame a width in a flex row, such as a `Cluster` or another
 * `Frame`, and in a `Stack` aligned other than `stretch`; it has none of its
 * own.
 */
const Frame = React.forwardRef<FrameElement, FrameProps>(
  ({ ratio, className, ...frameProps }, forwardedRef) => (
    <Primitive.div
      {...frameProps}
      ref={forwardedRef}
      className={cx("el-frame", className)}
      data-ratio={ratio}
    />
  ),
);

Frame.displayName = FRAME_NAME;

export { Frame, frameRatios };
export type { FrameProps, FrameRatio };
