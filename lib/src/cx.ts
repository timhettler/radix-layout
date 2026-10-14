/** Joins class names, ours first, skipping empty values. */
export const cx = (...names: Array<string | undefined>) =>
  names.filter(Boolean).join(" ");
