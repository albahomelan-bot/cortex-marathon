@echo off
chcp 65001 >nul
title Оновлення сайту cortex-marathon.pages.dev
cd /d "C:\Users\Admin\Documents\antigravity\radiant-rutherford\site-cortex-marathon"
node update_site.js
if %errorlevel% neq 0 (
    echo.
    echo Виникла помилка під час виконання!
    pause
)
