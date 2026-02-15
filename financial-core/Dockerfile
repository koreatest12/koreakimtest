FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests &&     mvn dependency:copy-dependencies -DoutputDirectory=target/dependency
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/target/dependency /app/lib
ENTRYPOINT ["java", "-cp", "app.jar:lib/*", "com.bank.core.FinancialSystem"]
