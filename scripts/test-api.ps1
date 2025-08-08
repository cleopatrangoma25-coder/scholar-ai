# Test Scholar AI API Endpoints
# This script tests the deployed functions to ensure they're working correctly

Write-Host "🧪 Testing Scholar AI API Endpoints..." -ForegroundColor Green

$API_BASE = "https://us-central1-scholar-ai-1-prod.cloudfunctions.net/api"

# Test 1: Health Check
Write-Host "`n📊 Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/health" -Method GET
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: RAG Query (Mock)
Write-Host "`n🤖 Test 2: RAG Query" -ForegroundColor Yellow
$ragPayload = @{
    query = "What is machine learning?"
    scope = "private"
    userId = "test-user"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/rag/query" -Method POST -Body $ragPayload -ContentType "application/json"
    Write-Host "✅ RAG query passed" -ForegroundColor Green
    Write-Host "Answer: $($response.answer)" -ForegroundColor Gray
} catch {
    Write-Host "❌ RAG query failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Conversation History
Write-Host "`n💬 Test 3: Conversation History" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/rag/conversation-history" -Method GET
    Write-Host "✅ Conversation history passed" -ForegroundColor Green
    Write-Host "Found $($response.Count) conversations" -ForegroundColor Gray
} catch {
    Write-Host "❌ Conversation history failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API Testing completed!" -ForegroundColor Green 