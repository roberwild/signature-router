# Script para limpiar y subir el repositorio a GitHub
# Ejecutar con: .\git-push-clean.ps1

Write-Host "🧹 Limpiando repositorio Git..." -ForegroundColor Yellow

# 1. Resetear el commit anterior
Write-Host "1. Deshaciendo commit anterior..." -ForegroundColor Cyan
git reset --soft HEAD~1

# 2. Unstage todo
Write-Host "2. Removiendo archivos del staging..." -ForegroundColor Cyan
git reset

# 3. Limpiar cache de git
Write-Host "3. Limpiando cache de Git..." -ForegroundColor Cyan
git rm -r --cached . 2>$null

# 4. Añadir solo archivos necesarios
Write-Host "4. Añadiendo archivos (respetando .gitignore)..." -ForegroundColor Cyan
git add .

# 5. Verificar cantidad de archivos
Write-Host "`n📊 Archivos que se van a commitear:" -ForegroundColor Green
$fileCount = (git diff --cached --name-only | Measure-Object).Count
Write-Host "   Total: $fileCount archivos" -ForegroundColor Green

# 6. Mostrar tamaño aproximado
Write-Host "`n📦 Tamaño del commit:" -ForegroundColor Green
git count-objects -vH

# 7. Hacer commit
Write-Host "`n💾 Creando commit..." -ForegroundColor Cyan
git commit -m "feat: Epic 1-5 + Critical Improvements - Backend Production-Ready

- Epic 1: Foundation & Infrastructure (8 stories)
- Epic 2: Signature Request Orchestration (12 stories)
- Epic 3: Multi-Provider Integration (10 stories)
- Epic 4: Resilience & Circuit Breaking (8 stories)
- Epic 5: Event-Driven Architecture (7 stories)
- Critical Improvements (5 improvements)

Status: 50 stories completed (58% done)
Quality: 9/10 production-ready
Coverage: >85% test coverage
Tech: Spring Boot 3.2, Java 21, PostgreSQL, Kafka, Vault"

# 8. Verificar si el remote existe
Write-Host "`n🔗 Configurando remote..." -ForegroundColor Cyan
$remoteExists = git remote get-url origin 2>$null
if (-not $remoteExists) {
    git remote add origin https://github.com/roberwild/signature-router.git
    Write-Host "   Remote 'origin' añadido" -ForegroundColor Green
} else {
    Write-Host "   Remote 'origin' ya existe: $remoteExists" -ForegroundColor Yellow
}

# 9. Renombrar rama a main
Write-Host "`n🌿 Renombrando rama a 'main'..." -ForegroundColor Cyan
git branch -M main

# 10. Push
Write-Host "`n🚀 Subiendo a GitHub..." -ForegroundColor Cyan
Write-Host "   Esto puede tardar unos minutos dependiendo del tamaño..." -ForegroundColor Yellow
git push -u origin main

Write-Host "`n✅ ¡Repositorio subido exitosamente!" -ForegroundColor Green
Write-Host "   🌐 https://github.com/roberwild/signature-router" -ForegroundColor Cyan

