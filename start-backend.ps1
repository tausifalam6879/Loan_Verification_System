Set-Location "C:\Users\hp\Downloads\VerificationSystem (1)\VerificationSystem"
$java = "C:\Program Files\Java\jdk-24\bin\java.exe"
$jar = "C:\Users\hp\Downloads\VerificationSystem (1)\VerificationSystem\target\VerificationSystem-0.0.1-SNAPSHOT.jar"
& $java -jar $jar *> "target\backend-run.log"
