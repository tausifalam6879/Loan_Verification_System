Set-Location "C:\Users\hp\Downloads\VerificationSystem (1)\VerificationSystem"
$java = "java"
if (-not (Get-Command java -ErrorAction SilentlyContinue) -and (Test-Path "$env:USERPROFILE\.jdks\openjdk-25.0.2\bin\java.exe")) {
    $java = "$env:USERPROFILE\.jdks\openjdk-25.0.2\bin\java.exe"
}
$jar = "C:\Users\hp\Downloads\VerificationSystem (1)\VerificationSystem\target\VerificationSystem-0.0.1-SNAPSHOT.jar"
& $java -jar $jar --spring.profiles.active=local *> "target\backend-run.log"
