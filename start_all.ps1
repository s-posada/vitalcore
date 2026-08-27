# Script de arranque rápido para VitalCore (Windows PowerShell)
Write-Host "=========================================" -ForegroundColor Green
Write-Host "   🚀 INICIANDO PLATAFORMA VITALCORE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$backendPath = "$PSScriptRoot\backend"
$frontendPath = "$PSScriptRoot\frontend"

# 1. Iniciar Backend FastAPI
Write-Host "`n[1/2] Iniciando Backend FastAPI en http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# 2. Iniciar Frontend Next.js
Write-Host "[2/2] Iniciando Frontend Next.js en http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Start-Sleep -Seconds 4
Write-Host "`n✨ VitalCore listo para operar:" -ForegroundColor Green
Write-Host "👉 Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "👉 Backend Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "👉 Super Admin: sposada2026@udec.cl" -ForegroundColor Yellow
