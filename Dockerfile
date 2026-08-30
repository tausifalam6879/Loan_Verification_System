FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/target/VerificationSystem-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 10000
# These JVM settings favour startup speed and a small memory footprint on
# Render's free single-core instance. They do not change application behaviour.
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
