# Task 1: Normalize and inventory source assets

Read `docs/superpowers/plans/2026-08-17-local-mvp.md`, but implement only Task 1 and obey its Global Constraints.

Create normalized UTF-8 course/design sources, normalized chart assets, `content/landing.html`, and `scripts/verify-site.mjs`. The verifier must export `verifyStaticAssets(rootDir)`, report each missing required path as `Missing: <relative-path>`, exit non-zero on failure when run directly, and print `Static asset inventory: PASS` on success.

Source files are in `C:\Users\Surface\AppData\Local\Temp`. Their Cyrillic names are mojibake in the filesystem listing; identify them by file type and size. Do not resize or recompress PNGs. Do not initialize Git. Write a detailed completion report to `.superpowers/sdd/2026-08-17-local-mvp/task-1-report.md` including files changed, exact test commands/output, and self-review concerns.
