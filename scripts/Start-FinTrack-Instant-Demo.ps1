$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $projectRoot "frontend"
$jarPath = Join-Path $projectRoot "target\VerificationSystem-0.0.1-SNAPSHOT.jar"
$backendPort = 8090
$backendHealth = "http://127.0.0.1:$backendPort/api/users/test"
$frontendUrl = "http://127.0.0.1:3000/Loan_Verification_System"

function Test-Url([string]$Url, [int]$TimeoutSeconds = 2) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch {
        return $false
    }
}

Write-Host "FinTrack instant demo launcher" -ForegroundColor Cyan
Write-Host "Preparing the services before opening Login..."

$needsBuild = -not (Test-Path $jarPath)
if (-not $needsBuild) {
    $jarTime = (Get-Item $jarPath).LastWriteTimeUtc
    $newestSource = Get-ChildItem (Join-Path $projectRoot "src") -Recurse -File |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1
    $needsBuild = $newestSource -and $newestSource.LastWriteTimeUtc -gt $jarTime
}

if ($needsBuild) {
    Write-Host "Building the latest backend once..."
    & (Join-Path $projectRoot "mvnw.cmd") package -DskipTests
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed." }
}

if (-not (Test-Url $backendHealth)) {
    $javaExe = (Get-Command java -ErrorAction SilentlyContinue).Source
    if (-not $javaExe) {
        $bundledJava = Join-Path $env:USERPROFILE ".jdks\openjdk-25.0.2\bin\java.exe"
        if (Test-Path $bundledJava) { $javaExe = $bundledJava }
    }
    if (-not $javaExe) { throw "Java was not found on this computer." }

    Write-Host "Starting the always-ready local backend..."
    Start-Process -FilePath $javaExe -WindowStyle Hidden -WorkingDirectory $projectRoot `
        -ArgumentList @("-jar", ('"{0}"' -f $jarPath), "--spring.profiles.active=local", "--server.port=$backendPort") `
        -RedirectStandardOutput (Join-Path $projectRoot "target\instant-demo-backend.log") `
        -RedirectStandardError (Join-Path $projectRoot "target\instant-demo-backend-error.log")

    $backendReady = $false
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        if (Test-Url $backendHealth) { $backendReady = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $backendReady) {
        throw "Local backend did not become ready. Check target\instant-demo-backend-error.log."
    }
}

if (-not (Test-Url "http://127.0.0.1:3000")) {
    Write-Host "Starting the local frontend..."
    $previousBrowser = $env:BROWSER
    $previousApiBase = $env:REACT_APP_API_BASE_URL
    $previousDemoMode = $env:REACT_APP_DEMO_MODE
    $env:BROWSER = "none"
    $env:REACT_APP_API_BASE_URL = "http://127.0.0.1:8090/api"
    $env:REACT_APP_DEMO_MODE = "false"
    Start-Process -FilePath "npm.cmd" -WindowStyle Hidden -WorkingDirectory $frontendRoot -ArgumentList @("start") `
        -RedirectStandardOutput (Join-Path $projectRoot "target\instant-demo-frontend.log") `
        -RedirectStandardError (Join-Path $projectRoot "target\instant-demo-frontend-error.log")
    $env:BROWSER = $previousBrowser
    $env:REACT_APP_API_BASE_URL = $previousApiBase
    $env:REACT_APP_DEMO_MODE = $previousDemoMode

    $frontendReady = $false
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        if (Test-Url "http://127.0.0.1:3000") { $frontendReady = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $frontendReady) {
        throw "Local frontend did not become ready. Check target\instant-demo-frontend-error.log."
    }
}

Write-Host "Ready. Login will now respond without a Render cold start." -ForegroundColor Green
Start-Process $frontendUrl
