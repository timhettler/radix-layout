/**
 * Waits for the preview iframe to reach a usable width.
 *
 * Several stories measure rendered boxes, and the Storybook manager (and the
 * Vitest browser runner) can mount the preview iframe far narrower than the
 * width those measurements assume — a wrapping assertion made at 0px is
 * meaningless. CSS re-lays out on resize, so no story needs the final width at
 * render time; it only has to wait before measuring.
 */
const MIN_PREVIEW_WIDTH = 320;

export async function previewSettled(timeoutMs = 3000): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  for (;;) {
    const width = document.documentElement.clientWidth;
    if (width >= MIN_PREVIEW_WIDTH) return;
    if (performance.now() > deadline) {
      console.warn(
        `previewSettled: the preview viewport is ${width}px, under the ${MIN_PREVIEW_WIDTH}px these stories are measured at. Any geometry asserted below it is unreliable.`,
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
}
