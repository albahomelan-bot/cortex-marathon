Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$siteDir = "C:\Users\Admin\Documents\antigravity\radiant-rutherford\site-cortex-marathon"
$statsFile = Join-Path $siteDir "stats.json"

# Calculate Day Number from 7 Sept 2026
$startDate = [DateTime]"2026-09-07"
$now = Get-Date
$dayNumber = [int]($now.Date - $startDate.Date).Days + 1
$monthsUa = @("січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня")
$monthsShortUa = @("січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру")

$dateLabel = "$($now.Day) $($monthsUa[$now.Month - 1])"
$yesterdayDate = "$($now.AddDays(-1).Day) $($monthsShortUa[$now.AddDays(-1).Month - 1])"

# Read existing stats
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

# Create Form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Шлях Інвестора • Оновлення сайту марафону"
$form.Size = New-Object System.Drawing.Size(460, 480)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 27)

$fontTitle = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$fontRegular = New-Object System.Drawing.Font("Segoe UI", 10)
$fontLabel = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)

# Title Label
$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "CORTEX MARATHON • ДЕНЬ $dayNumber"
$lblTitle.Font = $fontTitle
$lblTitle.ForeColor = [System.Drawing.Color]::FromArgb(250, 204, 21)
$lblTitle.Location = New-Object System.Drawing.Point(20, 15)
$lblTitle.Size = New-Object System.Drawing.Size(400, 30)
$form.Controls.Add($lblTitle)

# Subtitle
$lblSub = New-Object System.Windows.Forms.Label
$lblSub.Text = "Сьогодні: $dateLabel | https://cortex-marathon.pages.dev"
$lblSub.Font = $fontRegular
$lblSub.ForeColor = [System.Drawing.Color]::FromArgb(161, 161, 170)
$lblSub.Location = New-Object System.Drawing.Point(20, 45)
$lblSub.Size = New-Object System.Drawing.Size(400, 25)
$form.Controls.Add($lblSub)

# Function to add labeled input
function Add-Field($labelText, $defaultValue, $topPos) {
    $lbl = New-Object System.Windows.Forms.Label
    $lbl.Text = $labelText
    $lbl.Font = $fontLabel
    $lbl.ForeColor = [System.Drawing.Color]::FromArgb(228, 228, 231)
    $lbl.Location = New-Object System.Drawing.Point(25, $topPos)
    $lbl.Size = New-Object System.Drawing.Size(390, 20)
    $form.Controls.Add($lbl)

    $txt = New-Object System.Windows.Forms.TextBox
    $txt.Text = $defaultValue.ToString().Replace("+", "").Replace("$", "")
    $txt.Font = $fontRegular
    $txt.Location = New-Object System.Drawing.Point(25, ($topPos + 22))
    $txt.Size = New-Object System.Drawing.Size(390, 28)
    $txt.BackColor = [System.Drawing.Color]::FromArgb(39, 39, 42)
    $txt.ForeColor = [System.Drawing.Color]::White
    $txt.BorderStyle = "FixedSingle"
    $form.Controls.Add($txt)
    return $txt
}

$txtYesterday = Add-Field "1. Дохід за вчора (USDT) [$yesterdayDate]:" $prev.yesterdayProfit 80
$txtToday = Add-Field "2. Дохід на ранок сьогодні (USDT):" $prev.todayProfit 145
$txtMonth = Add-Field "3. За поточний місяць листопад (USDT):" $prev.monthProfit 210
$txtTotal = Add-Field "4. Загальний накопичений результат (USDT):" $prev.totalProfit 275

# Status Label
$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = ""
$lblStatus.Font = $fontRegular
$lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(34, 197, 94)
$lblStatus.Location = New-Object System.Drawing.Point(25, 345)
$lblStatus.Size = New-Object System.Drawing.Size(390, 25)
$form.Controls.Add($lblStatus)

# Button Save
$btnSave = New-Object System.Windows.Forms.Button
$btnSave.Text = "🚀 ОНОВИТИ САЙТ НА CLOUDFLARE"
$btnSave.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$btnSave.Location = New-Object System.Drawing.Point(25, 375)
$btnSave.Size = New-Object System.Drawing.Size(390, 42)
$btnSave.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$btnSave.ForeColor = [System.Drawing.Color]::White
$btnSave.FlatStyle = "Flat"
$btnSave.FlatAppearance.BorderSize = 0
$btnSave.Cursor = [System.Windows.Forms.Cursors]::Hand

$btnSave.Add_Click({
    $btnSave.Enabled = $false
    $btnSave.Text = "⏳ Відправляємо оновлення на GitHub..."
    $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(250, 204, 21)
    $lblStatus.Text = "Запис файлу та надсилання в репозиторій..."
    $form.Refresh()

    function Format-Profit($val, $fallback) {
        $clean = $val.Trim().Replace("$", "").Replace("+", "")
        if ([string]::IsNullOrWhiteSpace($clean)) { $clean = $fallback.Replace("$", "").Replace("+", "") }
        return "+$$clean"
    }

    $yProfit = Format-Profit $txtYesterday.Text $prev.yesterdayProfit
    $tProfit = Format-Profit $txtToday.Text $prev.todayProfit
    $mProfit = Format-Profit $txtMonth.Text $prev.monthProfit
    $totProfit = Format-Profit $txtTotal.Text $prev.totalProfit

    $newStats = [ordered]@{
        dayNumber = $dayNumber
        dateLabel = $dateLabel
        yesterdayDate = $yesterdayDate
        yesterdayProfit = $yProfit
        todayProfit = $tProfit
        monthProfit = $mProfit
        totalProfit = $totProfit
        status = "LIVE"
    }

    $newJson = $newStats | ConvertTo-Json -Depth 4
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($statsFile, $newJson + "`n", $utf8NoBom)

    try {
        Set-Location $siteDir
        & git add stats.json 2>&1 | Out-Null
        $msg = "Update marathon stats: Day $dayNumber ($dateLabel) - Yesterday $yProfit, Today $tProfit, Total $totProfit"
        & git commit -m $msg 2>&1 | Out-Null
        $pushOut = & git push origin main 2>&1
        
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(34, 197, 94)
        $lblStatus.Text = "✅ Успішно відправлено на Cloudflare!"
        [System.Windows.Forms.MessageBox]::Show("✅ Сайт успішно оновлено!`n`nПоказники зафіксовано:`n• Вчора: $yProfit`n• Сьогодні: $tProfit`n• Місяць: $mProfit`n• Разом: $totProfit`n`nCloudflare Pages оновить сторінку за 30-40 секунд:`nhttps://cortex-marathon.pages.dev", "Успіх!", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
        $form.Close()
    } catch {
        [System.Windows.Forms.MessageBox]::Show("Помилка при відправці: $_", "Помилка", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
        $btnSave.Enabled = $true
        $btnSave.Text = "🚀 ОНОВИТИ САЙТ НА CLOUDFLARE"
    }
})

$form.Controls.Add($btnSave)
[void]$form.ShowDialog()
