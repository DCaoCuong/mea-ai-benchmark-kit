# Pull All Benchmark Models
# Run this script to download all candidate models from Ollama
# Usage: powershell -ExecutionPolicy Bypass -File pull-models.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MEA Benchmark - Model Pull Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── LLM Models ───
$llmModels = @(
    "gemma2:2b",
    "qwen3:1.7b",
    "qwen3:4b",
    "gemma3:4b",
    "phi3:3.8b",
    "phi4-mini:3.8b",
    "llama3.2:3b",
    "llama3.2:1b"
    # "mistral:7b"  # Uncomment if VRAM allows
)

# ─── Embedding Models ───
$embeddingModels = @(
    "nomic-embed-text-v2-moe",
    "mxbai-embed-large",
    "all-minilm",
    "snowflake-arctic-embed"
)

$allModels = $llmModels + $embeddingModels
$total = $allModels.Count
$current = 0

Write-Host "Will pull $total models..." -ForegroundColor Yellow
Write-Host ""

foreach ($model in $allModels) {
    $current++
    Write-Host "[$current/$total] Pulling $model..." -ForegroundColor Green
    try {
        ollama pull $model
        Write-Host "  ✅ $model ready" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to pull $model : $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done! $total models processed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: STT models (WhisperX, Moonshine, Parakeet)" -ForegroundColor Yellow
Write-Host "need to be installed via pip in their respective conda envs." -ForegroundColor Yellow
