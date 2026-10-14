// Keys mirror _space.scss; the vocabulary story fails if they disagree.
// FPO: see docs/decisions/planning/responsive-rhythmic-scale.
const SPACES = [
  "1",
  "2",
  "3",
  "4",
  "6",
  "8",
  "12",
  "16",
  "20",
  "24",
  "30",
] as const;

/**
 * A step on the space scale. Strings rather than numbers so the prop and the
 * attribute are the same token: `space="4"` renders `data-space="4"`.
 */
export type Space = (typeof SPACES)[number];

/** Every accepted `space`, at runtime, so a control or a docs table does not restate the list. */
export const spaces: readonly Space[] = SPACES;
