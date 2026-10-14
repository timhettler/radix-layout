/** A step's gap in px, via the custom property the stylesheet reads. */
export function resolvedGap(step: string) {
  const probe = document.createElement("div");
  probe.setAttribute(
    "style",
    `position: absolute; visibility: hidden; row-gap: var(--el-space-${step})`,
  );
  document.body.append(probe);
  const value = parseFloat(getComputedStyle(probe).rowGap);
  probe.remove();
  return value;
}
