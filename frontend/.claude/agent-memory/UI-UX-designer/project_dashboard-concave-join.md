---
name: dashboard-concave-join
description: OBSOLETE — the sidebar↔content concave/inverted-radius join was removed. No ConcaveJoins component exists in the code anymore.
metadata:
  type: project
---

**OBSOLETE (verified 2026-06-21).** The experimental concave / inverted-radius fillets at the sidebar↔content junction (the `ConcaveJoins` component) were **removed**. A `grep` for `ConcaveJoin|concave|inverted-radius` over `src/` returns nothing. The final sidebar has a plain straight navy edge with `rounded-r-3xl` corners on the panel itself.

Do NOT document concave joins as a present feature. Kept this file only as a tombstone so the idea isn't reintroduced by accident from older memory. See [[sidebar-brand-active-pill]] for the current sidebar look.
