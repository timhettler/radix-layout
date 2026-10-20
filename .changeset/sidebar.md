---
"@timhettler/radix-layout": minor
---

Adds `Sidebar`: two unequal parts side by side, `Sidebar.Root`, `Sidebar.Side`
and `Sidebar.Content` (also exported as `SidebarRoot`, `SidebarSide` and
`SidebarContent`), that stack when the content would be narrower than its share
of the row. `--el-sidebar-side-width` and `--el-sidebar-content-min` set the two
lengths. It loads with `styles.css`, or as `sidebar.css` after `defaults.css`.
