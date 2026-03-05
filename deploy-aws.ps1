# Script de Deploy - Baú do Saber GSS (AWS)
# Este script sincroniza o protótipo com o S3 e limpa o cache do CloudFront

$BUCKET_NAME = "bau-do-saber-gss"
$DISTRIBUTION_ID = "XXXXXXXXXXXXXX" # Preencha após a criação da infra

Write-Host "🚀 Iniciando deploy para AWS S3..." -ForegroundColor Cyan

# 1. Sincronizar arquivos (ignora pastas de controle)
aws s3 sync . s3://$BUCKET_NAME --exclude ".git/*" --exclude ".gemini/*" --exclude "brain/*" --exclude "node_modules/*" --delete

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sincronização S3 concluída com sucesso!" -ForegroundColor Green
    
    # 2. Invalidação de cache no CloudFront (opcional, se usar CDN)
    if ($DISTRIBUTION_ID -ne "XXXXXXXXXXXXXX") {
        Write-Host "🧹 Limpando cache do CloudFront..." -ForegroundColor Yellow
        aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    }
    
    Write-Host "🌐 Deploy finalizado! Protótipo disponível na nuvem." -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy. Verifique suas credenciais com 'aws configure'." -ForegroundColor Red
}
