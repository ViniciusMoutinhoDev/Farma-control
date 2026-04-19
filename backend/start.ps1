# FarmaControl — Backend Starter
# Executa o uvicorn usando a venv correta (venv313)
# Uso: .\start.ps1

$ErrorActionPreference = "Stop"
$uvicorn = Join-Path $PSScriptRoot "venv313\Scripts\uvicorn.exe"

if (-not (Test-Path $uvicorn)) {
    Write-Host "[ERRO] venv313 não encontrada. Execute primeiro:" -ForegroundColor Red
    Write-Host "  python -m venv venv313" -ForegroundColor Yellow
    Write-Host "  .\venv313\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Iniciando FarmaControl API na porta 8000..." -ForegroundColor Green
& $uvicorn main:app --reload --port 8000
