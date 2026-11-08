@echo off
chcp 65001 >nul
title Оновлення сайту cortex-marathon.pages.dev
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\Admin\Documents\antigravity\radiant-rutherford\site-cortex-marathon\gui_updater.ps1"
