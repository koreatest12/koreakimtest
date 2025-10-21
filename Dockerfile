# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

# Cache dependencies
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests dependency:go-offline

# Build application
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests package

# Runtime image
FROM eclipse-temurin:17-jre-alpine
ENV JAVA_OPTS="" \
    SPRING_PROFILES_ACTIVE=default
WORKDIR /app
COPY --from=build /workspace/target/defenderbot.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
