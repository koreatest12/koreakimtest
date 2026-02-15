FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
# 1. 패키징 실행 2. 의존성 라이브러리 추출 (이 부분이 누락되어 에러가 발생했었습니다)
RUN mvn clean package -DskipTests &&     mvn dependency:copy-dependencies -DoutputDirectory=target/dependency

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# 빌드 스테이지에서 생성된 jar와 의존성 폴더를 모두 복사
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/target/dependency /app/lib
ENTRYPOINT ["java", "-cp", "app.jar:lib/*", "com.bank.core.FinancialSystem"]
