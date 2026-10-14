const MIN_PREVIEW_WIDTH = 320;

/** Waits for the preview iframe to reach MIN_PREVIEW_WIDTH; Storybook and the Vitest runner can mount it near 0px. */
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
