import type { Preview } from "@storybook/react";

// The aggregate, which is what most consumers load. It carries the
// `--el-space-*` defaults as well as every layout stylesheet; the stories'
// vocabulary checks scrape it, so this import is load-bearing.
import "@timhettler/radix-layout/styles.css";

import { previewSettled } from "../lib/viewport";

const preview: Preview = {
  // Several stories measure rendered boxes; wait once here rather than in each
  // play function.
  beforeEach: () => previewSettled(),
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Blocking on purpose: every consumer inherits whatever accessibility
      // defects ship here. Don't downgrade this to silence a failing story —
      // fix the component, or scope an exception on that one story with a
      // comment saying why.
      test: "error",
    },
  },
};

export default preview;
