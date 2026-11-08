# update_marathon.ps1
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Оновлення сайту cortex-marathon.pages.dev"

$siteDir = "C:\Users\Admin\Documents\antigravity\radiant-rutherford\site-cortex-marathon"
$statsFile = Join-Path $siteDir "stats.json"

Clear-Host
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   ШЛЯХ ІНВЕСТОРА • ОНОВЛЕННЯ САЙТУ CORTEX MARATHON    " -ForegroundColor Yellow
Write-Host "   https://cortex-marathon.pages.dev/                  " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Calculate Day Number from 7 Sept 2026
$startDate = [DateTime]"2026-09-07"
$now = Get-Date
$dayNumber = [int]($now.Date - $startDate.Date).Days + 1
$monthsUa = @("січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня")
$monthsShortUa = @("січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру")

$dateLabel = "$($now.Day) $($monthsUa[$now.Month - 1])"
$yesterdayDate = "$($now.AddDays(-1).Day) $($monthsShortUa[$now.AddDays(-1).Month - 1])"

Write-Host "📅 Сьогодні: $dateLabel (День $dayNumber марафону)" -ForegroundColor White
Write-Host ""

# Read existing stats if present
$prev = @{
    yesterdayProfit = "+$1"
    todayProfit = "+$0"
    monthProfit = "+$53"
    totalProfit = "+$917"
}

if (Test-Path $statsFile) {
    try {
        $json = Get-Content $statsFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($json.yesterdayProfit) { $prev.yesterdayProfit = $json.yesterdayProfit }
        if ($json.todayProfit) { $prev.todayProfit = $json.todayProfit }
        if ($json.monthProfit) { $prev.monthProfit = $json.monthProfit }
        if ($json.totalProfit) { $prev.totalProfit = $json.totalProfit }
    } catch {}
}

# Prompt inputs
function Clean-Number($val, $defaultVal) {
    if ([string]::IsNullOrWhiteSpace($val)) { return $defaultVal }
    $val = $val.Trim().Replace("$", "").Replace("+", "")
    return "+$$val"
}

Write-Host "Введіть показники (натисніть Enter, щоб підтвердити значення в дужках):" -ForegroundColor Gray
Write-Host ""

$inputYesterday = Read-Host "1. Дохід за вчора [$($prev.yesterdayProfit)]"
$yesterdayProfit = Clean-Number $inputYesterday $prev.yesterdayProfit

$inputToday = Read-Host "2. Дохід на ранок сьогодні [$($prev.todayProfit)]"
$todayProfit = Clean-Number $inputToday $prev.todayProfit

$inputMonth = Read-Host "3. За поточний місяць [$($prev.monthProfit)]"
$monthProfit = Clean-Number $inputMonth $prev.monthProfit

$inputTotal = Read-Host "4. Загальний накопичений дохід [$($prev.totalProfit)]"
$totalProfit = Clean-Number $inputTotal $prev.totalProfit

Write-Host ""
Write-Host "Фіксуємо показники:" -ForegroundColor Yellow
Write-Host " • День: $dayNumber ($dateLabel)" -ForegroundColor White
Write-Host " • Вчора ($yesterdayDate): $yesterdayProfit" -ForegroundColor Green
Write-Host " • Сьогодні: $todayProfit" -ForegroundColor Green
Write-Host " • Місяць: $monthProfit" -ForegroundColor Green
Write-Host " • Разом: $totalProfit" -ForegroundColor Green
Write-Host ""

$newStats = [ordered]@{
    dayNumber = $dayNumber
    dateLabel = $dateLabel
    yesterdayDate = $yesterdayDate
    yesterdayProfit = $yesterdayProfit
    todayProfit = $todayProfit
    monthProfit = $monthProfit
    totalProfit = $totalProfit
    status = "LIVE"
}

$newJson = $newStats | ConvertTo-Json -Depth 4
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($statsFile, $newJson + "`n", $utf8NoBom)

# Git Commit and Push
Write-Host "Відправляємо оновлення на GitHub для Cloudflare Pages..." -ForegroundColor Cyan
Set-Location $siteDir

git add stats.json
$commitMsg = "Update marathon stats: Day $dayNumber ($dateLabel) - Yesterday $yesterdayProfit, Today $todayProfit, Month $monthProfit, Total $totalProfit"
git commit -m $commitMsg
git push origin main

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "   ✅ САЙТ УСПІШНО ОНОВЛЕНО ТА ВІДПРАВЛЕНО!            " -ForegroundColor Yellow
Write-Host "   Сторінка оновиться на Cloudflare через 30-45 сек:   " -ForegroundColor White
Write-Host "   👉 https://cortex-marathon.pages.dev/               " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

Read-Host "Натисніть Enter для завершення..."
