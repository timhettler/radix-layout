# @timhettler/radix-layout

## 0.1.0-alpha.0

### Minor Changes

- 8a66a50: Supported browsers narrow to Baseline Newly Available, the current release of
  each core browser. Earlier Safari versions without `safe` alignment no longer
  get a plain-keyword fallback for `Stack` and `Cluster` center/end alignment.
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
- 544101f: Initial release: `Stack` and `Cluster`, ported from EJDS, with an overridable
  `--el-space-*` scale.
