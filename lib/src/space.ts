// Keys mirror _space.scss; the vocabulary story fails if they disagree.
const SPACES = ["xs", "s", "m", "l", "xl", "2xl"] as const;

/**
 * Augment with `space` when your stylesheet is compiled with its own `$spaces`,
 * so `Space` is your steps instead of the default scale's:
 *
 * ```ts
 * declare module "@timhettler/radix-layout" {
 *   interface Register {
 *     space: "100" | "200" | "300";
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- empty until a consumer augments it
export interface Register {}

type DefaultSpace = (typeof SPACES)[number];

/**
 * A step on the space scale. By default, `m` is the base and each step up or
 * down multiplies or divides by the ratio. The prop and the attribute are the
 * same token: `space="l"` renders `data-space="l"`.
 */
export type Space = Register extends { space: infer S extends string }
  ? S
  : DefaultSpace;

/** The default scale's steps, at runtime, so a control or a docs table does not restate the list. */
export const spaces: readonly DefaultSpace[] = SPACES;
