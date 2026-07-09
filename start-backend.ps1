$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot
$java = "java"
if (-not (Get-Command java -ErrorAction SilentlyContinue) -and (Test-Path "$env:USERPROFILE\.jdks\openjdk-25.0.2\bin\java.exe")) {
    $java = "$env:USERPROFILE\.jdks\openjdk-25.0.2\bin\java.exe"
}
$jar = Join-Path $projectRoot "target\VerificationSystem-0.0.1-SNAPSHOT.jar"
& $java -jar $jar @args *> "target\backend-run.log"
