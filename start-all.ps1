param(
    [ValidateSet("ollama", "gemini", "openai", "openai-compatible", "local")]
    [string]$Provider = $(if ($env:LLM_PROVIDER) { $env:LLM_PROVIDER } else { "ollama" }),

    [string]$Model = "",
    [string]$TimeoutMs = $(if ($env:LLM_TIMEOUT_MS) { $env:LLM_TIMEOUT_MS } else { "30000" })
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendRoot = Join-Path $projectRoot "frontend"

Set-Location $projectRoot

if (-not $Model) {
    $Model = switch ($Provider) {
        "ollama" { "llama3.2:3b" }
        "gemini" { "gemini-1.5-flash" }
        "openai" { "gpt-4o-mini" }
        "openai-compatible" { if ($env:LLM_MODEL) { $env:LLM_MODEL } else { "local-model" } }
        default { if ($env:LLM_MODEL) { $env:LLM_MODEL } else { "" } }
    }
}

$env:LLM_PROVIDER = $Provider
$env:LLM_MODEL = $Model
$env:LLM_TIMEOUT_MS = $TimeoutMs

if ($Provider -eq "ollama") {
    if (-not $env:OLLAMA_BASE_URL) {
        $env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
    }

    try {
        Invoke-WebRequest -Uri $env:OLLAMA_BASE_URL -UseBasicParsing -TimeoutSec 3 | Out-Null
        Write-Host "Ollama is reachable at $env:OLLAMA_BASE_URL"
    } catch {
        Write-Warning "Ollama is not reachable at $env:OLLAMA_BASE_URL. Start Ollama before using live local AI chat."
    }
}

if ($Provider -eq "gemini" -and -not $env:GEMINI_API_KEY) {
    Write-Warning "GEMINI_API_KEY is not set. Backend will return the clean AI configuration message."
}

if ($Provider -eq "openai" -and -not $env:OPENAI_API_KEY) {
    Write-Warning "OPENAI_API_KEY is not set. Backend will return the clean AI configuration message."
}

$jar = Join-Path $projectRoot "target\VerificationSystem-0.0.1-SNAPSHOT.jar"
if (-not (Test-Path $jar)) {
    Write-Host "Backend jar not found. Building backend first..."
    .\mvnw.cmd package -DskipTests
}

$backendCommand = @"
cd "$projectRoot"
.\start-backend.ps1
"@

$frontendCommand = @"
cd "$frontendRoot"
npm start
"@

Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand
Start-Sleep -Seconds 2
Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand

Write-Host "Started backend and frontend."
Write-Host "Frontend: http://localhost:3000/Loan_Verification_System"
Write-Host "Backend:  http://localhost:8081"
Write-Host "LLM provider: $Provider"
Write-Host "LLM model: $Model"
