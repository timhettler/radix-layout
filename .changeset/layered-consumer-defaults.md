---
"@timhettler/radix-layout": patch
---

Documents the one line a project with its own cascade layers, such as Tailwind
v4, needs: `@layer el.defaults;` at the top of its entry stylesheet. Without it,
a knob set from one of your layers loses to the library's default whenever your
stylesheet loads first.
