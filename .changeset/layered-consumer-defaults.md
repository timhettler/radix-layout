---
"@timhettler/radix-layout": patch
---

If your CSS uses its own cascade layers, as Tailwind v4 does, put
`@layer el.defaults;` at the top of your entry stylesheet. Without it, a knob
set from one of your layers on `:root` or on a layout's own element keeps the
library's default whenever your stylesheet loads first.
