import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";
import type { Space } from "./space";

/* -------------------------------------------------------------------------------------------------
 * Center
 * -----------------------------------------------------------------------------------------------*/

const CENTER_NAME = "Center";

type CenterElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface CenterProps extends PrimitiveDivProps {
  /** The least space either side of the content, as a step on the space scale. Omitted, there is none. */
  gutter?: Space;
}

/**
 * Center fills its parent up to a maximum width and centres itself, so its
 * content reads as one column: a page container, or an article held to a
 * readable measure.
 *
 * The content is at most `--el-center-max` wide (`60ch`, in the center's own
 * font), and `gutter` is the least space either side when the parent is
 * narrower. Set `--el-center-max`, or `--el-center-gutter` for a length off the
 * scale, on a class of your own. Padding of your own comes out of the measure.
 *
 * To centre children narrower than the column, such as a button, merge it onto
 * a stack: `<Center asChild><Stack space="m" align="center">`.
 *
 * Leaves block margins alone.
 */
const Center = React.forwardRef<CenterElement, CenterProps>(
  ({ gutter, className, ...centerProps }, forwardedRef) => (
    <Primitive.div
      {...centerProps}
      ref={forwardedRef}
      className={cx("el-center", className)}
      data-gutter={gutter}
    />
  ),
);

Center.displayName = CENTER_NAME;

export { Center };
export type { CenterProps };
