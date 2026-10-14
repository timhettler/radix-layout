import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";
import type { Space } from "./space";

/* -------------------------------------------------------------------------------------------------
 * Cluster
 * -----------------------------------------------------------------------------------------------*/

const CLUSTER_NAME = "Cluster";

const JUSTIFY = ["start", "center", "end", "between"] as const;

type ClusterJustify = (typeof JUSTIFY)[number];

const ALIGN = ["start", "center", "end", "stretch"] as const;

type ClusterAlign = (typeof ALIGN)[number];

const DISPLAY = ["block", "inline"] as const;

type ClusterDisplay = (typeof DISPLAY)[number];

/** Every accepted `justify`, `align` and `display`, at runtime. */
const clusterJustifies: readonly ClusterJustify[] = JUSTIFY;
const clusterAligns: readonly ClusterAlign[] = ALIGN;
const clusterDisplays: readonly ClusterDisplay[] = DISPLAY;

type ClusterElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface ClusterProps extends PrimitiveDivProps {
  /** Gap, as a step on the space scale. Required. */
  space: Space;
  /** Distribution along the row. Defaults to `start`. */
  justify?: ClusterJustify;
  /** Cross-axis alignment within a row. Defaults to `center`. */
  align?: ClusterAlign;
  /** Block- or inline-level flex container. Defaults to `block`. */
  display?: ClusterDisplay;
}

/**
 * Cluster lays its children out in a row, spaced by a step on the space scale,
 * wrapping when they run out of room.
 *
 * No item-level API.
 */
const Cluster = React.forwardRef<ClusterElement, ClusterProps>(
  (
    { space, justify, align, display, className, ...clusterProps },
    forwardedRef,
  ) => (
    <Primitive.div
      {...clusterProps}
      ref={forwardedRef}
      className={cx("el-cluster", className)}
      data-space={space}
      data-justify={justify}
      data-align={align}
      data-display={display}
    />
  ),
);

Cluster.displayName = CLUSTER_NAME;

export { Cluster, clusterAligns, clusterDisplays, clusterJustifies };
export type { ClusterAlign, ClusterDisplay, ClusterJustify, ClusterProps };
