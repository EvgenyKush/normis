[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SourcePath = Join-Path $ProjectRoot 'content\course.md'
$LettersSourcePath = Join-Path $ProjectRoot 'content\письма.md'
$SupportSourcePath = Join-Path $ProjectRoot 'content\support.html'

# Приём оплаты пока не подключён. Когда появится ссылка провайдера, впиши её сюда —
# кнопка оплаты соберётся сама, а до тех пор страница честно говорит, что приёма нет.
$script:PaymentLink = ''
$LettersDirectory = Join-Path $ProjectRoot 'letters'
$LandingSourcePath = Join-Path $ProjectRoot 'content\landing.html'
$OutputDirectory = Join-Path $ProjectRoot 'course'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$script:HeadingIdCounts = @{}
$script:TermCount = 0
$script:UsedHeadingIds = @{}
$script:PageEyebrows = @{}
$script:PageMetadata = @{
    'index'    = 'Глава 1 из 14'
    'module-1' = 'Глава 2 из 14'
    'escapes'  = 'Глава 3 из 14'
    'module-2' = 'Глава 4 из 14'
    'module-3' = 'Глава 5 из 14'
    'module-4' = 'Глава 6 из 14'
    'module-5' = 'Глава 7 из 14'
    'beauty'   = 'Глава 8 из 14'
    'health'   = 'Глава 9 из 14'
    'module-6' = 'Глава 10 из 14'
    'sex'      = 'Глава 11 из 14'
    'grief'    = 'Глава 12 из 14'
    'week'     = 'Глава 13 из 14'
    'finale'   = 'Глава 14 из 14'
}

$script:Pages = @(
    @{ Slug = 'index'; Label = 'Введение'; File = 'index.html' },
    @{ Slug = 'module-1'; Label = 'Механизмы'; File = 'module-1.html' },
    @{ Slug = 'escapes'; Label = 'Побеги'; File = 'escapes.html' },
    @{ Slug = 'module-2'; Label = 'Самоописание'; File = 'module-2.html' },
    @{ Slug = 'module-3'; Label = 'Достаточность'; File = 'module-3.html' },
    @{ Slug = 'module-4'; Label = 'Плато'; File = 'module-4.html' },
    @{ Slug = 'module-5'; Label = 'Взаимоотношения'; File = 'module-5.html' },
    @{ Slug = 'beauty'; Label = 'Красота'; File = 'beauty.html' },
    @{ Slug = 'health'; Label = 'Здоровье'; File = 'health.html' },
    @{ Slug = 'module-6'; Label = 'Финансы'; File = 'module-6.html' },
    @{ Slug = 'sex'; Label = 'Секс'; File = 'sex.html' },
    @{ Slug = 'grief'; Label = 'Горе'; File = 'grief.html' },
    @{ Slug = 'week'; Label = 'Неделя'; File = 'week.html' },
    @{ Slug = 'finale'; Label = 'Финал'; File = 'finale.html' }
)
$script:Letters = @()

$script:ChartNotes = @{
    '01-housing-vs-salaries.png' = 'Данные иллюстративные: типовое соотношение динамик, а не конкретная страна.'
    '02-minimum-payment.png' = 'Иллюстративная модель: долг 300 тыс., ставка 25% годовых, платёж — минимальные 3,5% от остатка ежемесячно.'
    '03-price-slicing.png' = 'Допущение: 24 равных ежемесячных платежа по 990; комиссии и проценты не учитываются.'
    '04-better-vs-enough.png' = 'Схематическая иллюстрация: шкалы условны и не являются измерением благополучия.'
    '05-growth-vs-plateau.png' = 'Схематическая иллюстрация: уровень навыка и сроки условны; реальная траектория не обязана быть линейной.'
}

function ConvertTo-HtmlEncodedText {
    param([AllowEmptyString()][string]$Text)

    if ($null -eq $Text) { return '' }
    return $Text.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;').Replace("'", '&#39;')
}

function Convert-ImageSource {
    param([Parameter(Mandatory = $true)][string]$Source)

    $chartNames = @{
        '01' = '01-housing-vs-salaries.png'
        '02' = '02-minimum-payment.png'
        '03' = '03-price-slicing.png'
        '04' = '04-better-vs-enough.png'
        '05' = '05-growth-vs-plateau.png'
    }
    if ($Source -match '(?:^|/)(0[1-5])-[^/]+\.png$') {
        return '../assets/charts/' + $chartNames[$Matches[1]]
    }
    return $Source
}

function Convert-InlineMarkdown {
    param([AllowEmptyString()][string]$Text)

    $encoded = ConvertTo-HtmlEncodedText $Text
    $codeTokens = New-Object 'System.Collections.Generic.List[string]'
    $encoded = [regex]::Replace($encoded, '`([^`]+)`', [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)
        $tokenIndex = $codeTokens.Count
        $codeTokens.Add('<code>' + $match.Groups[1].Value + '</code>')
        return "@@CODE$tokenIndex@@"
    })

    $encoded = [regex]::Replace($encoded, '!\[([^\]]*)\]\(([^)\s]+)\)', [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)
        $source = Convert-ImageSource $match.Groups[2].Value
        return '<img src="' + (ConvertTo-HtmlEncodedText $source) + '" alt="' + $match.Groups[1].Value + '">'
    })
    $encoded = [regex]::Replace($encoded, '(?<!!)\[([^\]]+)\]\(([^)\s]+)\)', [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)
        return '<a href="' + $match.Groups[2].Value + '">' + $match.Groups[1].Value + '</a>'
    })
    $encoded = [regex]::Replace($encoded, '\[\?([^:\]]+):\s*([^\]]+)\]', [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)
        $script:TermCount += 1
        $termId = 'term-' + $script:TermCount
        $term = $match.Groups[1].Value.Trim()
        $explanation = $match.Groups[2].Value.Trim()
        return '<button class="term" type="button" popovertarget="' + $termId + '" aria-describedby="' + $termId + '">' + $term + '</button>' + '<span class="term-note" id="' + $termId + '" popover role="note">' + $explanation + '</span>'
    })
    $encoded = [regex]::Replace($encoded, '\*\*(.+?)\*\*', '<strong>$1</strong>')
    $encoded = [regex]::Replace($encoded, '__(.+?)__', '<strong>$1</strong>')
    $encoded = [regex]::Replace($encoded, '(?<!\*)\*([^*\r\n]+)\*(?!\*)', '<em>$1</em>')
    $encoded = [regex]::Replace($encoded, '(?<!\w)_([^_\r\n]+)_(?!\w)', '<em>$1</em>')

    for ($index = 0; $index -lt $codeTokens.Count; $index += 1) {
        $encoded = $encoded.Replace("@@CODE$index@@", $codeTokens[$index])
    }
    return $encoded
}

function ConvertTo-HeadingBase {
    param([Parameter(Mandatory = $true)][string]$Heading)

    $plain = $Heading
    $plain = [regex]::Replace($plain, '!\[([^\]]*)\]\([^)]+\)', '$1')
    $plain = [regex]::Replace($plain, '\[([^\]]+)\]\([^)]+\)', '$1')
    $plain = $plain.Replace('**', '').Replace('__', '').Replace('*', '').Replace('_', '').Replace('`', '')
    $identifier = $plain.ToLowerInvariant()
    $identifier = [regex]::Replace($identifier, '[^a-zа-яё0-9]+', '-')
    $identifier = $identifier.Trim('-')
    if ([string]::IsNullOrWhiteSpace($identifier)) { $identifier = 'section' }
    return $identifier
}

function New-HeadingId {
    param([Parameter(Mandatory = $true)][string]$Heading)

    $identifier = ConvertTo-HeadingBase $Heading

    if (-not $script:UsedHeadingIds.ContainsKey($identifier)) {
        $script:HeadingIdCounts[$identifier] = 1
        $script:UsedHeadingIds[$identifier] = $true
        return $identifier
    }

    $suffix = if ($script:HeadingIdCounts.ContainsKey($identifier)) { $script:HeadingIdCounts[$identifier] + 1 } else { 2 }
    $candidate = $identifier + '-' + $suffix
    while ($script:UsedHeadingIds.ContainsKey($candidate)) {
        $suffix += 1
        $candidate = $identifier + '-' + $suffix
    }
    $script:HeadingIdCounts[$identifier] = $suffix
    $script:UsedHeadingIds[$candidate] = $true
    return $candidate
}

function Split-MarkdownTableRow {
    param([Parameter(Mandatory = $true)][string]$Line)

    $row = $Line.Trim()
    if ($row.StartsWith('|')) { $row = $row.Substring(1) }
    if ($row.EndsWith('|')) { $row = $row.Substring(0, $row.Length - 1) }
    return @($row.Split('|') | ForEach-Object { $_.Trim() })
}

function Convert-PageHeadingLevels {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string[]]$Lines)

    $encounteredBodyH2 = $false
    $normalized = New-Object 'System.Collections.Generic.List[string]'
    foreach ($line in $Lines) {
        if ($line -match '^(#{2,6})\s+(.+)$') {
            $level = $Matches[1].Length
            $headingText = $Matches[2]
            if ($level -eq 2) {
                $encounteredBodyH2 = $true
            } elseif (-not $encounteredBodyH2) {
                $level -= 1
            }
            $normalized.Add(('#' * $level) + ' ' + $headingText)
        } else {
            $normalized.Add($line)
        }
    }
    return $normalized.ToArray()
}

function Get-VisibleWordCount {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Html)

    $visibleText = [regex]::Replace($Html, '<[^>]+>', ' ')
    $visibleText = [System.Net.WebUtility]::HtmlDecode($visibleText)
    return [regex]::Matches($visibleText, "[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*").Count
}

function Convert-BlockMarkdown {
    param(
        [Parameter(Mandatory = $true)][AllowEmptyString()][string[]]$Lines,
        [string[]]$ReservedHeadingIds = @()
    )

    $script:HeadingIdCounts = @{}
    $script:UsedHeadingIds = @{}
    $script:TermCount = 0
    foreach ($reservedId in $ReservedHeadingIds) {
        if ($reservedId) { $script:UsedHeadingIds[$reservedId] = $true }
    }
    $html = New-Object 'System.Collections.Generic.List[string]'
    $paragraph = New-Object 'System.Collections.Generic.List[string]'
    $listType = $null
    $listItems = New-Object 'System.Collections.Generic.List[string]'
    $orderedStart = 1

    function Flush-Paragraph {
        if ($paragraph.Count -gt 0) {
            $text = ($paragraph -join ' ').Trim()
            if ($text) { $html.Add('<p>' + (Convert-InlineMarkdown $text) + '</p>') }
            $paragraph.Clear()
        }
    }

    function Flush-List {
        if ($listItems.Count -eq 0) { return }
        if ($listType -eq 'ol' -and $orderedStart -ne 1) {
            $html.Add('<ol start="' + $orderedStart + '">')
        } else {
            $html.Add('<' + $listType + '>')
        }
        foreach ($item in $listItems) {
            $html.Add('<li>' + (Convert-InlineMarkdown $item) + '</li>')
        }
        $html.Add('</' + $listType + '>')
        $listItems.Clear()
        Set-Variable -Name listType -Value $null -Scope 1
        Set-Variable -Name orderedStart -Value 1 -Scope 1
    }

    $index = 0
    while ($index -lt $Lines.Count) {
        $line = $Lines[$index]

        if ([string]::IsNullOrWhiteSpace($line)) {
            Flush-Paragraph
            Flush-List
            $index += 1
            continue
        }

        if ($line -match '^(#{1,6})\s+(.+?)\s*$') {
            Flush-Paragraph
            Flush-List
            $level = $Matches[1].Length
            $heading = $Matches[2]
            $headingId = New-HeadingId $heading
            $html.Add("<h$level id=`"$headingId`">" + (Convert-InlineMarkdown $heading) + "</h$level>")
            $index += 1
            continue
        }

        if ($line -match '^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})\s*$') {
            Flush-Paragraph
            Flush-List
            $html.Add('<hr>')
            $index += 1
            continue
        }

        if ($line -match '^>\s?(.*)$') {
            Flush-Paragraph
            Flush-List
            $quoteLines = New-Object 'System.Collections.Generic.List[string]'
            while ($index -lt $Lines.Count -and $Lines[$index] -match '^>\s?(.*)$') {
                $quoteLines.Add($Matches[1])
                $index += 1
            }
            $html.Add('<blockquote><p>' + (Convert-InlineMarkdown (($quoteLines -join ' ').Trim())) + '</p></blockquote>')
            continue
        }

        if ($line -match '^\s*\|.*\|\s*$' -and
            $index + 1 -lt $Lines.Count -and
            $Lines[$index + 1] -match '^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$') {
            Flush-Paragraph
            Flush-List
            $headers = Split-MarkdownTableRow $line
            $html.Add('<div class="table-scroll" tabindex="0" role="region" aria-label="Таблица, прокручивается по горизонтали">')
            $html.Add('<table>')
            $html.Add('<thead>')
            $html.Add('<tr>')
            foreach ($header in $headers) {
                $html.Add('<th scope="col">' + (Convert-InlineMarkdown $header) + '</th>')
            }
            $html.Add('</tr>')
            $html.Add('</thead>')
            $html.Add('<tbody>')
            $index += 2
            while ($index -lt $Lines.Count -and $Lines[$index] -match '^\s*\|.*\|\s*$') {
                $cells = Split-MarkdownTableRow $Lines[$index]
                if ($cells.Count -ne $headers.Count) {
                    throw "Markdown table row has $($cells.Count) cells but the header has $($headers.Count): $($Lines[$index])"
                }
                $html.Add('<tr>')
                foreach ($cell in $cells) {
                    $html.Add('<td>' + (Convert-InlineMarkdown $cell) + '</td>')
                }
                $html.Add('</tr>')
                $index += 1
            }
            if ($index -lt $Lines.Count -and $Lines[$index] -match '^\s*\|') {
                throw "Malformed Markdown table row (missing trailing pipe or bad shape): $($Lines[$index])"
            }
            $html.Add('</tbody>')
            $html.Add('</table>')
            $html.Add('</div>')
            continue
        }

        if ($line -match '^\s*[-+*]\s+(.+)$') {
            Flush-Paragraph
            if ($listType -and $listType -ne 'ul') { Flush-List }
            if (-not $listType) { $listType = 'ul' }
            $listItems.Add($Matches[1])
            $index += 1
            continue
        }

        if ($line -match '^\s*(\d+)\.\s+(.+)$') {
            Flush-Paragraph
            if ($listType -and $listType -ne 'ol') { Flush-List }
            if (-not $listType) {
                $listType = 'ol'
                $orderedStart = [int]$Matches[1]
            }
            $listItems.Add($Matches[2])
            $index += 1
            continue
        }

        if ($line -match '^!\[([^\]]*)\]\(([^)]+)\)(?:\s+(.*))?$') {
            Flush-Paragraph
            Flush-List
            $alt = ConvertTo-HtmlEncodedText $Matches[1]
            $originalSource = $Matches[2]
            $trailingText = $Matches[3]
            $convertedSource = Convert-ImageSource $originalSource
            $source = ConvertTo-HtmlEncodedText $convertedSource
            $caption = $alt
            $chartName = [System.IO.Path]::GetFileName($convertedSource)
            if ($script:ChartNotes.ContainsKey($chartName)) {
                $caption += '. ' + (ConvertTo-HtmlEncodedText $script:ChartNotes[$chartName])
            }
            $html.Add('<figure class="chart-figure">')
            $html.Add('<img src="' + $source + '" alt="' + $alt + '">')
            $html.Add('<figcaption>' + $caption + '</figcaption>')
            $html.Add('</figure>')
            if ($trailingText) { $paragraph.Add($trailingText) }
            $index += 1
            continue
        }

        if ($listType) { Flush-List }
        $paragraph.Add($line.Trim())
        $index += 1
    }

    Flush-Paragraph
    Flush-List
    return $html -join "`n"
}

function Get-CourseTocHtml {
    param([Parameter(Mandatory = $true)][string]$CurrentSlug)

    $items = foreach ($page in $script:Pages) {
        $current = if ($page.Slug -eq $CurrentSlug) { ' aria-current="page"' } else { '' }
        '<li><a href="' + $page.File + '"' + $current + '>' + (ConvertTo-HtmlEncodedText $page.Label) + '</a></li>'
    }
    return $items -join "`n"
}

function Get-ChapterLinkHtml {
    param($Chapter, [string]$Direction)

    if ($null -eq $Chapter) {
        return '<span aria-hidden="true"></span>'
    }
    $prefix = if ($Direction -eq 'Previous') { '← Назад: ' } else { 'Дальше: ' }
    $suffix = if ($Direction -eq 'Next') { ' →' } else { '' }
    return '<a class="button button--secondary" href="' + $Chapter.File + '">' + $prefix + (ConvertTo-HtmlEncodedText $Chapter.Label) + $suffix + '</a>'
}

function Write-CoursePage {
    param(
        [Parameter(Mandatory = $true)][string]$Slug,
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string]$BodyHtml,
        $Previous,
        $Next
    )

    $encodedTitle = ConvertTo-HtmlEncodedText $Title
    $siteName = 'Достаточная версия себя'
    $pageTitle = if ($encodedTitle -eq $siteName) { $siteName } else { "$encodedTitle — $siteName" }
    $tocHtml = Get-CourseTocHtml $Slug
    $previousHtml = Get-ChapterLinkHtml $Previous 'Previous'
    $nextHtml = Get-ChapterLinkHtml $Next 'Next'
    $metadata = ConvertTo-HtmlEncodedText $script:PageMetadata[$Slug]
    $titleId = ConvertTo-HeadingBase $Title
    $wordCount = Get-VisibleWordCount $BodyHtml
    $readingMinutes = [Math]::Max(1, [int][Math]::Ceiling($wordCount / 180.0))
    $eyebrowHtml = ''
    if ($script:PageEyebrows.ContainsKey($Slug)) {
        $eyebrow = ConvertTo-HtmlEncodedText $script:PageEyebrows[$Slug]
        $eyebrowHtml = "<p class=`"chapter-eyebrow`">$eyebrow</p>`n"
    }
    $scriptTags = ''
    $sharedScripts = @('progress.js', 'site.js')
    foreach ($scriptName in $sharedScripts) {
        if (Test-Path -LiteralPath (Join-Path $ProjectRoot ('assets\js\' + $scriptName)) -PathType Leaf) {
            $scriptTags += "`n<script src=`"../assets/js/$scriptName`" defer></script>"
        }
    }

    $document = @"
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="$encodedTitle — курс «Достаточная версия себя»">
<title>$pageTitle</title>
<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/site.css">$scriptTags
</head>
<body data-page-kind="course" data-course-slug="$Slug">
<a class="skip-link" href="#main-content">Перейти к содержанию</a>
<header class="site-header shell">
<nav class="site-nav" aria-label="Основная навигация">
<a class="site-nav__brand" href="../index.html" aria-label="Достаточная версия себя — на главную"><span class="brand-swap" aria-hidden="true"><span class="brand-swap__fix">достаточная</span><s class="brand-swap__old">лучшая</s></span> <span class="highlight">версия себя</span></a>
<div class="site-nav__links">
<a href="index.html">Содержание</a>
<a href="../support.html">Поддержать</a>
</div>
</nav>
</header>
<main id="main-content" class="shell reader-layout">
<details class="course-toc" open>
<summary>Содержание курса</summary>
<ol>
$tocHtml
</ol>
</details>
<article class="prose">
<header class="chapter-header">
$eyebrowHtml<h1 id="$titleId">$encodedTitle</h1>
<p>$metadata · <span class="reading-time" data-word-count="$wordCount">$readingMinutes мин чтения</span></p>
<div class="progress-summary" data-progress-enhancement hidden>
<p><span data-progress-count>0</span> из $($script:Pages.Count) глав отмечено как прочитанные.</p>
<p data-completed-state aria-live="polite">Глава пока не отмечена как прочитанная.</p>
<button class="button button--secondary" type="button" data-mark-complete>Отметить прочитанным</button>
<a class="button button--secondary" data-continue-link hidden>Продолжить чтение</a>
</div>
</header>
$BodyHtml
<nav class="chapter-nav" aria-label="Навигация по главам">
$previousHtml
$nextHtml
</nav>
</article>
</main>
</body>
</html>
"@

    $document = $document.Replace("`r`n", "`n").TrimEnd() + "`n"
    $fileName = ($script:Pages | Where-Object { $_.Slug -eq $Slug }).File
    $targetPath = Join-Path $OutputDirectory $fileName
    [System.IO.File]::WriteAllText($targetPath, $document, $Utf8NoBom)
}

function Get-LettersTocHtml {
    param([string]$CurrentSlug = '')

    $items = foreach ($letter in $script:Letters) {
        $current = if ($letter.Slug -eq $CurrentSlug) { ' aria-current="page"' } else { '' }
        '<li><a href="' + $letter.File + '"' + $current + '>' + (ConvertTo-HtmlEncodedText $letter.Label) + '</a></li>'
    }
    return $items -join "`n"
}

function Write-LetterDocument {
    param(
        [Parameter(Mandatory = $true)][string]$FileName,
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string]$Eyebrow,
        [Parameter(Mandatory = $true)][string]$BodyHtml,
        [string]$CurrentSlug = '',
        [string]$MetaLine = '',
        [string]$NavHtml = ''
    )

    $encodedTitle = ConvertTo-HtmlEncodedText $Title
    $siteName = 'Достаточная версия себя'
    $pageTitle = if ($encodedTitle -eq $siteName) { $siteName } else { "$encodedTitle — $siteName" }
    $encodedEyebrow = ConvertTo-HtmlEncodedText $Eyebrow
    $titleId = ConvertTo-HeadingBase $Title
    $tocHtml = Get-LettersTocHtml $CurrentSlug
    $scriptTags = ''
    if (Test-Path -LiteralPath (Join-Path $ProjectRoot 'assets\js\site.js') -PathType Leaf) {
        $scriptTags = "`n<script src=`"../assets/js/site.js`" defer></script>"
    }

    $document = @"
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="$encodedTitle — письма курса «Достаточная версия себя»">
<title>$pageTitle</title>
<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/site.css">$scriptTags
</head>
<body data-page-kind="letter">
<a class="skip-link" href="#main-content">Перейти к содержанию</a>
<header class="site-header shell">
<nav class="site-nav" aria-label="Основная навигация">
<a class="site-nav__brand" href="../index.html" aria-label="Достаточная версия себя — на главную"><span class="brand-swap" aria-hidden="true"><span class="brand-swap__fix">достаточная</span><s class="brand-swap__old">лучшая</s></span> <span class="highlight">версия себя</span></a>
<div class="site-nav__links">
<a href="index.html">Все письма</a>
<a href="../course/index.html">Содержание курса</a>
</div>
</nav>
</header>
<main id="main-content" class="shell reader-layout">
<details class="course-toc" open>
<summary>Шесть писем</summary>
<ol>
$tocHtml
</ol>
</details>
<article class="prose">
<header class="chapter-header">
<p class="chapter-eyebrow">$encodedEyebrow</p><h1 id="$titleId">$encodedTitle</h1>
$MetaLine</header>
$BodyHtml
$NavHtml</article>
</main>
</body>
</html>
"@

    $document = $document.Replace("`r`n", "`n").TrimEnd() + "`n"
    [System.IO.File]::WriteAllText((Join-Path $LettersDirectory $FileName), $document, $Utf8NoBom)
}

function Write-Letters {
    if (-not (Test-Path -LiteralPath $LettersSourcePath -PathType Leaf)) {
        throw "Letters source not found: $LettersSourcePath"
    }

    $lines = [System.IO.File]::ReadAllLines($LettersSourcePath, [System.Text.Encoding]::UTF8)
    $starts = @()
    for ($i = 0; $i -lt $lines.Count; $i += 1) {
        if ($lines[$i] -match '^## Письмо (\d+)\. Тема: (.+)$') {
            $starts += [pscustomobject]@{ Index = $i; Number = $Matches[1]; Title = $Matches[2].Trim() }
        }
    }
    if ($starts.Count -eq 0) {
        throw "No letters found in $LettersSourcePath"
    }

    $script:Letters = @()
    for ($k = 0; $k -lt $starts.Count; $k += 1) {
        $slug = 'letter-' + $starts[$k].Number
        $endIndex = if ($k + 1 -lt $starts.Count) { $starts[$k + 1].Index - 1 } else { $lines.Count - 1 }
        $script:Letters += [pscustomobject]@{
            Slug  = $slug
            File  = $slug + '.html'
            Label = 'Письмо ' + $starts[$k].Number
            Title = $starts[$k].Title
            Start = $starts[$k].Index + 1
            End   = $endIndex
        }
    }

    [System.IO.Directory]::CreateDirectory($LettersDirectory) | Out-Null
    $expected = @('index.html') + ($script:Letters | ForEach-Object { $_.File })
    Get-ChildItem -LiteralPath $LettersDirectory -Filter '*.html' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notin $expected } |
        Remove-Item -Force

    $indexItems = @()
    for ($k = 0; $k -lt $script:Letters.Count; $k += 1) {
        $letter = $script:Letters[$k]
        $bodyLines = New-Object 'System.Collections.Generic.List[string]'
        for ($lineIndex = $letter.Start; $lineIndex -le $letter.End; $lineIndex += 1) {
            $bodyLines.Add($lines[$lineIndex])
        }

        $script:HeadingIdCounts = @{}
        $script:UsedHeadingIds = @{}
        $titleId = ConvertTo-HeadingBase $letter.Title
        $normalized = Convert-PageHeadingLevels $bodyLines
        $bodyHtml = Convert-BlockMarkdown $normalized @($titleId)
        if (-not $bodyHtml) {
            throw "Letter '$($letter.Slug)' has no body content between source lines $($letter.Start) and $($letter.End)"
        }

        $wordCount = Get-VisibleWordCount $bodyHtml
        $readingMinutes = [Math]::Max(1, [int][Math]::Ceiling($wordCount / 180.0))
        $metaLine = '<p>' + $letter.Label + ' из ' + $script:Letters.Count + ' · <span class="reading-time" data-word-count="' + $wordCount + '">' + $readingMinutes + ' мин чтения</span></p>' + "`n"

        $previous = if ($k -gt 0) { $script:Letters[$k - 1] } else { $null }
        $next = if ($k + 1 -lt $script:Letters.Count) { $script:Letters[$k + 1] } else { $null }
        $previousHtml = if ($null -eq $previous) {
            '<a class="button button--secondary" href="index.html">← Назад: все письма</a>'
        } else {
            '<a class="button button--secondary" href="' + $previous.File + '">← Назад: ' + (ConvertTo-HtmlEncodedText $previous.Label) + '</a>'
        }
        $nextHtml = if ($null -eq $next) {
            '<a class="button button--secondary" href="../course/index.html">Дальше: весь курс →</a>'
        } else {
            '<a class="button button--secondary" href="' + $next.File + '">Дальше: ' + (ConvertTo-HtmlEncodedText $next.Label) + ' →</a>'
        }
        $navHtml = '<nav class="chapter-nav" aria-label="Навигация по письмам">' + "`n" + $previousHtml + "`n" + $nextHtml + "`n" + '</nav>' + "`n"

        Write-LetterDocument -FileName $letter.File -Title $letter.Title -Eyebrow $letter.Label -BodyHtml $bodyHtml -CurrentSlug $letter.Slug -MetaLine $metaLine -NavHtml $navHtml

        $indexItems += '<li><a href="' + $letter.File + '"><strong>' + (ConvertTo-HtmlEncodedText $letter.Label) + '.</strong> ' + (ConvertTo-HtmlEncodedText $letter.Title) + '</a></li>'
    }

    $script:HeadingIdCounts = @{}
    $script:UsedHeadingIds = @{}
    $indexBody = '<p>Шесть писем курса: медленный маршрут для тех, кому так удобнее. Рассылки нет и адрес нигде не спрашивают — письма просто лежат здесь, как и весь курс.</p>' + "`n" + '<ol class="letters-list">' + "`n" + ($indexItems -join "`n") + "`n" + '</ol>'
    Write-LetterDocument -FileName 'index.html' -Title 'Шесть писем' -Eyebrow 'Письма' -BodyHtml $indexBody

    Write-Output "Letter pages generated: $($script:Letters.Count + 1)"
}


function Write-SupportPage {
    if (-not (Test-Path -LiteralPath $SupportSourcePath -PathType Leaf)) {
        throw "Support source not found: $SupportSourcePath"
    }

    $document = [System.IO.File]::ReadAllText($SupportSourcePath, [System.Text.Encoding]::UTF8)
    if ([string]::IsNullOrWhiteSpace($document)) {
        throw "Support source is empty: $SupportSourcePath"
    }

    if ([string]::IsNullOrWhiteSpace($script:PaymentLink)) {
        # Без провайдера полю суммы некуда вести — поля нет вовсе, вместо него объяснение.
        $amountBlock = '<p class="support-amount support-amount__pending">Приём оплаты пока не подключён. Как только появится, здесь будет поле для своей суммы и кнопка — а курс всё это время читается как читался.</p>'
    }
    else {
        $encodedLink = ConvertTo-HtmlEncodedText $script:PaymentLink
        $amountBlock = @'
<form class="support-amount" data-support-form novalidate>
<label class="support-amount__label" for="support-amount">Своя сумма</label>
<div class="support-amount__row">
<input class="support-amount__input" id="support-amount" name="amount" type="number" inputmode="numeric" min="0" step="50" placeholder="0" autocomplete="off">
<span class="support-amount__currency">₽</span>
</div>
<p class="support-amount__hint" data-support-hint>Можно оставить пустым.</p>
'@
        $amountBlock += '<a class="button button--secondary" href="' + $encodedLink + '" rel="noopener" data-support-pay>Поддержать курс</a>' + "`n</form>"
    }

    $replacements = [ordered]@{
        '{{THEME_CSS}}'     = 'assets/css/theme.css'
        '{{SITE_CSS}}'      = 'assets/css/site.css'
        '{{SITE_JS}}'       = 'assets/js/site.js'
        '{{COURSE_INDEX}}'  = 'course/index.html'
        '{{AMOUNT_BLOCK}}'  = $amountBlock
    }
    foreach ($entry in $replacements.GetEnumerator()) {
        $document = $document.Replace($entry.Key, $entry.Value)
    }

    $unresolved = [regex]::Matches($document, '\{\{[A-Z0-9_]+\}\}') |
        ForEach-Object { $_.Value } |
        Sort-Object -Unique
    if ($unresolved.Count -gt 0) {
        throw 'Unresolved support placeholders: ' + ($unresolved -join ', ')
    }

    $document = $document.Replace("`r`n", "`n").TrimEnd() + "`n"
    [System.IO.File]::WriteAllText((Join-Path $ProjectRoot 'support.html'), $document, $Utf8NoBom)
    Write-Output 'Support page generated: 1'
}

function Write-LandingPage {
    if (-not (Test-Path -LiteralPath $LandingSourcePath -PathType Leaf)) {
        throw "Preserved landing source not found: $LandingSourcePath"
    }

    $document = [System.IO.File]::ReadAllText($LandingSourcePath, [System.Text.Encoding]::UTF8)
    if ([string]::IsNullOrWhiteSpace($document)) {
        throw "Preserved landing source is empty: $LandingSourcePath"
    }

    $replacements = [ordered]@{
        '{{THEME_CSS}}'       = 'assets/css/theme.css'
        '{{SITE_CSS}}'        = 'assets/css/site.css'
        '{{PROGRESS_JS}}'      = 'assets/js/progress.js'
        '{{QUIZ_JS}}'          = 'assets/js/quiz.js'
        '{{SITE_JS}}'          = 'assets/js/site.js'
        '{{COURSE_INDEX}}'     = 'course/index.html'
        '{{LETTERS}}'          = 'letters/index.html'
        '{{SUPPORT}}'          = 'support.html'
        '{{MODULE_1}}'         = 'course/module-1.html'
        '{{ESCAPES}}'          = 'course/escapes.html'
        '{{BEAUTY}}'           = 'course/beauty.html'
        '{{HEALTH}}'           = 'course/health.html'
        '{{SEX}}'              = 'course/sex.html'
        '{{GRIEF}}'            = 'course/grief.html'
        '{{MODULE_2}}'         = 'course/module-2.html'
        '{{MODULE_3}}'         = 'course/module-3.html'
        '{{MODULE_4}}'         = 'course/module-4.html'
        '{{MODULE_5}}'         = 'course/module-5.html'
        '{{MODULE_6}}'         = 'course/module-6.html'
        '{{WEEK}}'             = 'course/week.html'
        '{{FINALE}}'           = 'course/finale.html'
        '{{QUIZ_TEXT}}'        = 'course/module-6.html#тесты-как-я-обычно-поступаю-vs-как-я-бы-поступил-с-критическим-мышлением'
        '{{CONTINUE_LINK}}'    = '<a href="course/index.html" data-continue-link hidden>Продолжить с места</a>'
        '{{QUIZ_ROOT}}'        = '<div class="quiz" data-quiz aria-labelledby="quiz-title"><p data-quiz-status aria-live="polite">Тест готов к началу.</p><p data-quiz-result aria-live="polite"></p></div>'
    }
    foreach ($entry in $replacements.GetEnumerator()) {
        $document = $document.Replace($entry.Key, $entry.Value)
    }

    $unresolved = [regex]::Matches($document, '\{\{[A-Z0-9_]+\}\}') |
        ForEach-Object { $_.Value } |
        Sort-Object -Unique
    if ($unresolved.Count -gt 0) {
        throw 'Unresolved landing placeholders: ' + ($unresolved -join ', ')
    }

    $document = $document.Replace("`r`n", "`n").TrimEnd() + "`n"
    [System.IO.File]::WriteAllText((Join-Path $ProjectRoot 'index.html'), $document, $Utf8NoBom)
}

function Find-LineIndex {
    param([string[]]$Lines, [string]$Pattern)

    for ($index = 0; $index -lt $Lines.Count; $index += 1) {
        if ($Lines[$index] -match $Pattern) { return $index }
    }
    throw "Canonical heading not found: $Pattern"
}

if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
    throw "Canonical course source not found: $SourcePath"
}

$sourceLines = [System.IO.File]::ReadAllLines($SourcePath, [System.Text.Encoding]::UTF8)
$partOne = Find-LineIndex $sourceLines '^# ЧАСТЬ I\.'
$moduleOne = Find-LineIndex $sourceLines '^## Модуль 1\b'
$escapes = Find-LineIndex $sourceLines '^# ПОБЕГИ'
$partTwo = Find-LineIndex $sourceLines '^# ЧАСТЬ II\.'
$moduleTwo = Find-LineIndex $sourceLines '^## Модуль 2\.'
$moduleThree = Find-LineIndex $sourceLines '^## Модуль 3\.'
$moduleFour = Find-LineIndex $sourceLines '^## Модуль 4\.'
$moduleFive = Find-LineIndex $sourceLines '^## Модуль 5\.'
$beauty = Find-LineIndex $sourceLines '^# КРАСОТА И ВНЕШНОСТЬ'
$health = Find-LineIndex $sourceLines '^# ЗДОРОВЬЕ:'
$partThree = Find-LineIndex $sourceLines '^# ЧАСТЬ III\.'
$moduleSix = Find-LineIndex $sourceLines '^## Модуль 6\.'
$sex = Find-LineIndex $sourceLines '^# СЕКС\s*$'
$grief = Find-LineIndex $sourceLines '^# ГОРЕ,'
$week = Find-LineIndex $sourceLines '^# НЕДЕЛЯ ОБЫЧНОГО ЧЕЛОВЕКА\s*$'
$finale = Find-LineIndex $sourceLines '^# ФИНАЛ\s*$'

$definitions = @(
    @{ Slug = 'index'; TitleIndex = 0; Start = 1; End = $partOne - 1 },
    @{ Slug = 'module-1'; TitleIndex = $moduleOne; Start = $moduleOne + 1; End = $escapes - 1; PartIndex = $partOne },
    @{ Slug = 'escapes'; TitleIndex = $escapes; Start = $escapes + 1; End = $partTwo - 1; PartIndex = $partOne },
    @{ Slug = 'module-2'; TitleIndex = $moduleTwo; Start = $moduleTwo + 1; End = $moduleThree - 1; PartIndex = $partTwo },
    @{ Slug = 'module-3'; TitleIndex = $moduleThree; Start = $moduleThree + 1; End = $moduleFour - 1 },
    @{ Slug = 'module-4'; TitleIndex = $moduleFour; Start = $moduleFour + 1; End = $moduleFive - 1 },
    @{ Slug = 'module-5'; TitleIndex = $moduleFive; Start = $moduleFive + 1; End = $beauty - 1 },
    @{ Slug = 'beauty'; TitleIndex = $beauty; Start = $beauty + 1; End = $health - 1; PartIndex = $partTwo },
    @{ Slug = 'health'; TitleIndex = $health; Start = $health + 1; End = $partThree - 1 },
    @{ Slug = 'module-6'; TitleIndex = $moduleSix; Start = $moduleSix + 1; End = $sex - 1; PartIndex = $partThree },
    @{ Slug = 'sex'; TitleIndex = $sex; Start = $sex + 1; End = $grief - 1 },
    @{ Slug = 'grief'; TitleIndex = $grief; Start = $grief + 1; End = $week - 1 },
    @{ Slug = 'week'; TitleIndex = $week; Start = $week + 1; End = $finale - 1 },
    @{ Slug = 'finale'; TitleIndex = $finale; Start = $finale + 1; End = $sourceLines.Count - 1 }
)

[System.IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null
$expectedFiles = $script:Pages.File
Get-ChildItem -LiteralPath $OutputDirectory -Filter '*.html' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notin $expectedFiles } |
    Remove-Item -Force

for ($pageIndex = 0; $pageIndex -lt $definitions.Count; $pageIndex += 1) {
    $definition = $definitions[$pageIndex]
    $title = $sourceLines[$definition.TitleIndex] -replace '^#{1,6}\s+', ''
    $bodyLines = New-Object 'System.Collections.Generic.List[string]'
    if ($definition.ContainsKey('PartIndex')) {
        $script:PageEyebrows[$definition.Slug] = $sourceLines[$definition.PartIndex] -replace '^#\s+', ''
    }
    if ($definition.Start -le $definition.End) {
        for ($lineIndex = $definition.Start; $lineIndex -le $definition.End; $lineIndex += 1) {
            $bodyLines.Add($sourceLines[$lineIndex])
        }
    }
    $titleId = ConvertTo-HeadingBase $title
    $normalizedBodyLines = Convert-PageHeadingLevels $bodyLines.ToArray()
    $bodyHtml = Convert-BlockMarkdown $normalizedBodyLines @($titleId)
    $previous = if ($pageIndex -gt 0) { $script:Pages[$pageIndex - 1] } else { $null }
    $next = if ($pageIndex -lt $definitions.Count - 1) { $script:Pages[$pageIndex + 1] } else { $null }
    Write-CoursePage $definition.Slug $title $bodyHtml $previous $next
}

Write-Letters
Write-SupportPage
Write-LandingPage
Write-Output "Course pages generated: $($script:Pages.Count - 1)"
Write-Output 'Landing page generated: 1'
