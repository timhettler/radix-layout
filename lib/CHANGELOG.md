# @timhettler/radix-layout

## 0.1.0-alpha.0

### Minor Changes

- 8a66a50: Supported browsers narrow to Baseline Newly Available, the current release of
  each core browser. Earlier Safari versions without `safe` alignment no longer
  get a plain-keyword fallback for `Stack` and `Cluster` center/end alignment.
- 4c4cf56: Adds `Bleed`, a child of a centred column that reaches the edges of the nearest
  `BleedBoundary` above it, at any depth, with no horizontal overflow under a
  classic scrollbar. `--el-bleed-max` on the boundary caps every bleed inside it.
  For HTML you don't author, `@include el.bleed` from
  `pkg:@timhettler/radix-layout/mixins` applies the same rule to your own
  selector. It loads with `styles.css`, or as `bleed.css` after `defaults.css`.
- 627b18a: Adds `Center`: a column centred in its parent and filling it up to
  `--el-center-max` (`60ch`), with a `gutter` on the space scale either side when
  the parent is narrower. `--el-center-gutter` takes a gutter off the scale. Merge
  it onto a `Stack` with `asChild` and `align="center"` to centre children
  narrower than the column. It loads with `styles.css`, or as `center.css` after
  `defaults.css`.
- 711eb97: New: `--el-cluster-flow: stack`, set on a cluster's own class under your media
  or container query, stacks every child at full width. The values are exported as
  `clusterFlows`.
- 50d81b8: Adds `Cover`: a column whose principal child takes the space its header and
  footer leave, either centred in it (`Cover.Centered`) or grown into it
  (`Cover.Fill`). Its parts are `Cover.Root`, `Cover.Centered` and `Cover.Fill`,
  also exported as `CoverRoot`, `CoverCentered` and `CoverFill`. `min="screen"`
  makes it at least the viewport's height, and `--el-cover-min` sets any other
  minimum. It loads with `styles.css`, or as `cover.css` after `defaults.css`.
- 8333972: **Breaking:** the space steps are renamed to `xs` `s` `m` `l` `xl` `2xl`, a
  fluid modular scale (base `0.75rem`, ratio 1.5) that grows with the layout's
  nearest query container. Every `space` prop and `--el-space-*` override needs
  the new names; nearest equivalents are `1`→`xs`, `2`→`s`, `3`→`m`, `4`→`l`,
  `6`/`8`→`xl` and `12`→`2xl`. Steps `16` and above have no default equivalent:
  add your own steps.
  
  New: `--el-space-base` and `--el-space-ratio` retune every step, and a project
  can compile the stylesheet with its own steps through
  `@use "pkg:@timhettler/radix-layout" with ($spaces: …)`, typed by augmenting
  `Register`.
- cca427c: Adds `Frame`: a box of a fixed aspect ratio that crops its content, filling and
  cropping a child `img`, `video`, `iframe` or `picture` and centring anything
  else. `ratio` takes `1:1`, `16:9` (the default) or `4:5`, listed in
  `frameRatios`; `--el-frame-ratio` sets any other. It loads with `styles.css`, or
  as `frame.css` after `defaults.css`.
- 544101f: Initial release: `Stack` and `Cluster`, ported from EJDS, with an overridable
  `--el-space-*` scale.
- 4e22849: Adds `Sidebar`: two unequal parts side by side that stack when the content would
  be narrower than its share of the row. Its parts are `Sidebar.Root`,
  `Sidebar.Side` and `Sidebar.Content`, also exported as `SidebarRoot`,
  `SidebarSide` and `SidebarContent`. `--el-sidebar-side-width` and
  `--el-sidebar-content-min` set the two lengths. It loads with `styles.css`, or
  as `sidebar.css` after `defaults.css`.
- dd01b0b: Adds `Switcher`: children in one row of equal widths that all stack at once when
  any would be narrower than `min` (`s`, `m` or `l`). It loads with `styles.css`,
  or as `switcher.css` after `defaults.css`. It needs `sibling-count()`: Chrome
  138, Safari 26.2 and Firefox 154.

### Patch Changes

- d4870c3: If your CSS uses its own cascade layers, as Tailwind v4 does, put
  `@layer el.defaults;` at the top of your entry stylesheet. Without it, a knob
  set from one of your layers on `:root` or on a layout's own element keeps the
  library's default whenever your stylesheet loads first.
