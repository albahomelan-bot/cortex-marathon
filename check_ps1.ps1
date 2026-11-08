$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile('C:\Users\Admin\Documents\antigravity\radiant-rutherford\site-cortex-marathon\gui_updater.ps1', [ref]$tokens, [ref]$errors)
if ($errors) {
    Write-Host "ERRORS FOUND:"
    $errors | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "PERFECT! NO ERRORS!"
}
