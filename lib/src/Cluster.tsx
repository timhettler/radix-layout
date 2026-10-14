import * as React from "react";
import { Primitive } from "@radix-ui/react-primitive";

import { cx } from "./cx";
import type { Space } from "./space";

/* -------------------------------------------------------------------------------------------------
 * Cluster
 * -----------------------------------------------------------------------------------------------*/

const CLUSTER_NAME = "Cluster";

/**
 * Distribution along the row.
 *
 * The keyword is not the CSS value: `cluster.css` maps `between` to
 * `space-between` and `start` to `flex-start`. Curated rather than
 * pass-through, so the keyword a consumer hardcodes outlives a change to how the
 * layout is implemented.
 */
const JUSTIFY = ["start", "center", "end", "between"] as const;

type ClusterJustify = (typeof JUSTIFY)[number];

/** Cross-axis alignment of the items within a row. */
const ALIGN = ["start", "center", "end", "stretch"] as const;

type ClusterAlign = (typeof ALIGN)[number];

/**
 * The box level: whether the cluster is a block-level flex container or an
 * inline-level one.
 *
 * The keyword names the **box level, not the display value**: `block` is
 * `display: flex`, not `display: block`; `inline` is `inline-flex`.
 */
const DISPLAY = ["block", "inline"] as const;

type ClusterDisplay = (typeof DISPLAY)[number];

/** Every accepted `justify`, `align` and `display`, at runtime. */
const clusterJustifies: readonly ClusterJustify[] = JUSTIFY;
const clusterAligns: readonly ClusterAlign[] = ALIGN;
const clusterDisplays: readonly ClusterDisplay[] = DISPLAY;

type ClusterElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface ClusterProps extends PrimitiveDivProps {
  /**
   * The gap between items, as a step on the space scale. **Required**: there is
   * no default and no opt-out. A layout that needs an off-scale value wants its
   * own flex container, not this one.
   */
  space: Space;
  /** Distribution along the row. Defaults to `start`. */
  justify?: ClusterJustify;
  /** Cross-axis alignment within a row. Defaults to `center`. */
  align?: ClusterAlign;
  /**
   * Whether the cluster is a block-level flex container or an inline-level one.
   * Defaults to `block`. The one axis about the cluster's _own_ box rather than
   * its children's, so a row can be composed into something inline.
   */
  display?: ClusterDisplay;
}

/**
 * Cluster lays its children out in a row, spaced by a step on the space scale,
 * wrapping when they run out of room.
 *
 * The appearance is `cluster.css` — the `.el-cluster` class and its `data-*`
 * vocabulary — so that stylesheet has to be loaded.
 *
 * Container-only by design: no item-level attributes and no `Cluster.Item`.
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
      // Omitted rather than defaulted, so `.el-cluster`'s own declarations stay
      // the single definition of each default.
      data-justify={justify}
      data-align={align}
      data-display={display}
    />
  ),
);

Cluster.displayName = CLUSTER_NAME;

export { Cluster, clusterAligns, clusterDisplays, clusterJustifies };
export type { ClusterAlign, ClusterDisplay, ClusterJustify, ClusterProps };
