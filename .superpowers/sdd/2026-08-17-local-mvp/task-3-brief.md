# Task 3: Build deterministic course pages

Implement only Task 3 from `docs/superpowers/plans/2026-08-17-local-mvp.md` and obey its Global Constraints.

Create the deterministic PowerShell generator and eight course pages. Extend the Node verifier/tests for required pages, local href/src resolution, one main and h1, UTF-8 metadata, and root/overview links. Implement the Markdown subset actually used by `content/course.md`, deterministic Cyrillic/Latin heading IDs, split introduction/modules 1–6/final, insert normalized chart figures in their canonical conceptual locations, and generate semantic shells with skip link, navigation, metadata, article, native-details mobile TOC, and previous/next links. Preserve source paragraph order and do not rewrite content.

Generated files must use the existing shared CSS class contracts and relative paths that work under `file://`. Preserve Tasks 1–2 checks. Do not initialize Git. Write exact evidence and self-review to `.superpowers/sdd/2026-08-17-local-mvp/task-3-report.md`.
