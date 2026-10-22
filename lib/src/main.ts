export { spaces } from "./space";
export type { Register, Space } from "./space";

export { Stack, stackAligns } from "./Stack";
export type { StackAlign, StackProps } from "./Stack";

export {
  Cluster,
  clusterAligns,
  clusterDisplays,
  clusterFlows,
  clusterJustifies,
} from "./Cluster";
export type {
  ClusterAlign,
  ClusterDisplay,
  ClusterFlow,
  ClusterJustify,
  ClusterProps,
} from "./Cluster";

export { Switcher, switcherMins } from "./Switcher";
export type { SwitcherMin, SwitcherProps } from "./Switcher";

export * as Sidebar from "./SidebarParts";
export {
  SidebarContent,
  SidebarRoot,
  SidebarSide,
  sidebarAligns,
} from "./Sidebar";
export type {
  SidebarAlign,
  SidebarContentProps,
  SidebarRootProps,
  SidebarSideProps,
} from "./Sidebar";

export { Center } from "./Center";
export type { CenterProps } from "./Center";

export { Bleed, BleedBoundary } from "./Bleed";
export type { BleedBoundaryProps, BleedProps } from "./Bleed";
