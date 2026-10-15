/**
 * A step's gap in px, via the custom property the stylesheet reads, resolved
 * inside `parent` so a container-relative step sees the same container.
 */
export function resolvedGap(step: string, parent: Element = document.body) {
  const probe = document.createElement("div");
  probe.setAttribute(
    "style",
    `position: absolute; visibility: hidden; row-gap: var(--el-space-${step})`,
  );
  parent.append(probe);
  const value = parseFloat(getComputedStyle(probe).rowGap);
  probe.remove();
  return value;
}
