@echo off
chcp 65001 >nul
title Оновлення сайту cortex-marathon.pages.dev

:: 1. Запуск фонового мосту Telegram та планувальника (якщо не запущені)
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (-not (Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | Where-Object { $_.CommandLine -like '*services_supervisor*' })) { wscript.exe 'C:\Users\Admin\Documents\antigravity\radiant-rutherford\run_services_silent.vbs' }"

:: 2. Ранкове вікно для внесення результатів дня та публікації
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\Admin\Documents\antigravity\radiant-rutherford\site-cortex-marathon\gui_updater.ps1"
