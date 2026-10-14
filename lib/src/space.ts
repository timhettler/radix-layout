// Keys mirror _space.scss; the vocabulary story fails if they disagree.
// FPO: a naive linear stepping, not the final scale — the step names are
// expected to change before 1.0 (docs/decisions/planning/responsive-rhythmic-scale).
const SPACE_PROPERTY = {
  "1": "--el-space-1",
  "2": "--el-space-2",
  "3": "--el-space-3",
  "4": "--el-space-4",
  "6": "--el-space-6",
  "8": "--el-space-8",
  "12": "--el-space-12",
  "16": "--el-space-16",
  "20": "--el-space-20",
  "24": "--el-space-24",
  "30": "--el-space-30",
} as const satisfies Record<string, `--el-space-${string}`>;

/**
 * A step on the space scale. Strings rather than numbers so the prop and the
 * attribute are the same token: `space="4"` renders `data-space="4"`.
 */
export type Space = keyof typeof SPACE_PROPERTY;

/** Every accepted `space`, at runtime, so a control or a docs table does not restate the list. */
export const spaces = Object.keys(SPACE_PROPERTY) as readonly Space[];
