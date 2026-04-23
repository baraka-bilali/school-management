# Script pour tuer tous les processus Node.js et Prisma qui bloquent les fichiers
Write-Host "🔄 Fermeture des processus Node.js et Prisma..." -ForegroundColor Cyan

# Tuer tous les processus node.exe
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Processus Node.js fermés: $($nodeProcesses.Count)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun processus Node.js trouvé" -ForegroundColor Yellow
}

# Tuer tous les processus tsx
$tsxProcesses = Get-Process -Name "tsx" -ErrorAction SilentlyContinue
if ($tsxProcesses) {
    $tsxProcesses | Stop-Process -Force
    Write-Host "✅ Processus tsx fermés: $($tsxProcesses.Count)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun processus tsx trouvé" -ForegroundColor Yellow
}

# Attendre un peu pour que les fichiers soient libérés
Start-Sleep -Seconds 2

Write-Host "`n✨ Prêt pour npx prisma generate!" -ForegroundColor Green
