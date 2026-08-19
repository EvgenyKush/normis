# Task 1 completion report: Normalize and inventory source assets

## Files changed

- `content/course.md` — normalized UTF-8 copy of the supplied canonical Markdown.
- `content/landing.html` — UTF-8 semantic `<main>` fragment extracted from the supplied landing page.
- `design/DESIGN.md` — supplied design reference copied to the stable path.
- `design/tokens.json` — supplied design tokens copied to the stable path.
- `assets/charts/01-housing-vs-salaries.png` — byte-preserving normalized chart copy.
- `assets/charts/02-minimum-payment.png` — byte-preserving normalized chart copy.
- `assets/charts/03-price-slicing.png` — byte-preserving normalized chart copy.
- `assets/charts/04-better-vs-enough.png` — byte-preserving normalized chart copy.
- `assets/charts/05-growth-vs-plateau.png` — byte-preserving normalized chart copy.
- `scripts/verify-site.mjs` — source asset inventory verifier exporting `verifyStaticAssets(rootDir)`.
- `tests/verify-static-assets.test.mjs` — Node contract test for a directory placed where a required regular file belongs.

## Test record

### Failing inventory check (before normalization)

Command:

```powershell
node scripts/verify-site.mjs
```

Output (non-zero exit):

```text
Missing: content/course.md
Missing: content/landing.html
Missing: assets/charts/01-housing-vs-salaries.png
Missing: assets/charts/02-minimum-payment.png
Missing: assets/charts/03-price-slicing.png
Missing: assets/charts/04-better-vs-enough.png
Missing: assets/charts/05-growth-vs-plateau.png
```

### Directory-at-required-file-path regression test (before the fix)

Command:

```powershell
node --test tests/verify-static-assets.test.mjs
```

Output (non-zero exit):

```text
✖ reports a required path when it is a directory instead of a file (9.9511ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 75.5357

✖ failing tests:

test at tests\verify-static-assets.test.mjs:9:1
✖ reports a required path when it is a directory instead of a file (9.9511ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
  
    assert.ok(
  
      at TestContext.<anonymous> (file:///C:/Users/Surface/Projects/normis/tests/verify-static-assets.test.mjs:16:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
  }
```

### Final verifier, directory-path contract, hashes, landing extraction, and UTF-8 title

Command:

```powershell
node --test tests/verify-static-assets.test.mjs
node scripts/verify-site.mjs
$tempDir = 'C:\Users\Surface\AppData\Local\Temp'
$sizePairs = @(
  @{ SourceSize = 103561; Target = 'assets\charts\01-housing-vs-salaries.png' },
  @{ SourceSize = 134791; Target = 'assets\charts\02-minimum-payment.png' },
  @{ SourceSize = 56480; Target = 'assets\charts\03-price-slicing.png' },
  @{ SourceSize = 110414; Target = 'assets\charts\04-better-vs-enough.png' },
  @{ SourceSize = 63893; Target = 'assets\charts\05-growth-vs-plateau.png' }
)
foreach ($pair in $sizePairs) {
  $source = Get-ChildItem -LiteralPath $tempDir -File | Where-Object { $_.Extension -eq '.png' -and $_.Length -eq $pair.SourceSize } | Select-Object -First 1
  $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $source.FullName).Hash
  $targetHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $pair.Target).Hash
  "$($pair.Target): source=$sourceHash target=$targetHash match=$($sourceHash -eq $targetHash)"
}
$landing = Get-Content -Raw -Encoding UTF8 'content\landing.html'
"content/landing.html: exact-main-fragment=$($landing -match '(?is)^<main\b.*</main>$')"
$course = Get-Content -Raw -Encoding UTF8 'content\course.md'
[regex]::Match($course, 'Обычная версия себя').Value
```

Output:

```text
✔ reports a required path when it is a directory instead of a file (4.0076ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 65.566
Static asset inventory: PASS
assets\charts\01-housing-vs-salaries.png: source=2E620720391AD727AFD94BF31C93C80A3E162E8FB634E3240714166E5DF8415F target=2E620720391AD727AFD94BF31C93C80A3E162E8FB634E3240714166E5DF8415F match=True
assets\charts\02-minimum-payment.png: source=7C80B20CC36A97B0F26A84E5D8AB0092F5674FEFE5347215B157EEC9D53D50A1 target=7C80B20CC36A97B0F26A84E5D8AB0092F5674FEFE5347215B157EEC9D53D50A1 match=True
assets\charts\03-price-slicing.png: source=7C35ACE80D4D55A54EE1F90B12B7E8D237F346B5A02C2A0C067BB86C946F2550 target=7C35ACE80D4D55A54EE1F90B12B7E8D237F346B5A02C2A0C067BB86C946F2550 match=True
assets\charts\04-better-vs-enough.png: source=B5EFB77CFC8551C860A61192E58EDE38563B93F28CFD2ACDFD1FC1990C3982FE target=B5EFB77CFC8551C860A61192E58EDE38563B93F28CFD2ACDFD1FC1990C3982FE match=True
assets\charts\05-growth-vs-plateau.png: source=CA955BF596836CFEF1E8B302BDDB42B210A7CBC225455BA209286C49190ECD6B target=CA955BF596836CFEF1E8B302BDDB42B210A7CBC225455BA209286C49190ECD6B match=True
content/landing.html: exact-main-fragment=True
Обычная версия себя
```

## Self-review and concerns

- The verifier intentionally covers only Task 1’s required source paths. Later tasks are expected to extend it with CSS, generated-page, link, and accessibility contracts.
- Supplied source filenames display as mojibake in the filesystem listing. Sources were selected from the Temp directory by the required extension and exact byte length, avoiding dependence on those displayed filenames.
- Chart bytes were copied without resizing or recompression; SHA-256 comparisons confirm identity.
- `verifyStaticAssets` now treats only successful `statSync(...).isFile()` results as present; missing paths, unreadable paths, and directories therefore produce the required `Missing: <relative-path>` failure.
- No Git repository was initialized and no dependency was added.
