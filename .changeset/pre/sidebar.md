---
"@timhettler/radix-layout": minor
---

Adds `Sidebar`: two unequal parts side by side that stack when the content would
be narrower than its share of the row. Its parts are `Sidebar.Root`,
`Sidebar.Side` and `Sidebar.Content`, also exported as `SidebarRoot`,
`SidebarSide` and `SidebarContent`. `--el-sidebar-side-width` and
`--el-sidebar-content-min` set the two lengths. It loads with `styles.css`, or
as `sidebar.css` after `defaults.css`.
