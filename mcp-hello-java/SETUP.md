# MCP Hello Java - 설치 가이드 (Setup Guide)

이 가이드는 Java MCP 서버를 설치하고 Claude Code와 연동하는 방법을 안내합니다.

## 사전 요구사항 (Prerequisites)

- Java 17 이상
- Maven 3.6+ (또는 IntelliJ IDEA)

## 빌드 방법 (Build Instructions)

### 방법 1: IntelliJ IDEA 사용 (권장)

1. IntelliJ IDEA에서 `mcp-hello-java` 폴더를 프로젝트로 엽니다
2. Maven이 자동으로 의존성을 다운로드할 때까지 기다립니다
3. 메뉴에서 `Build` → `Build Project` 선택
4. 또는 우측의 Maven 도구창에서 `Lifecycle` → `package` 더블클릭

빌드가 완료되면 `target/mcp-hello-java-1.0.0.jar` 파일이 생성됩니다.

### 방법 2: 명령줄 사용

Maven이 PATH에 설정되어 있다면:

```bash
cd mcp-hello-java
mvn clean package -DskipTests
```

또는 제공된 빌드 스크립트 실행:

```bash
build.bat
```

## Claude Desktop 설정

### 1. .mcp.json 확인

`C:\Users\kwonn\.mcp.json` 파일에 다음 설정이 추가되어 있는지 확인하세요:

```json
{
  "mcpServers": {
    "hello-mcp-java": {
      "command": "java",
      "args": [
        "-jar",
        "C:\\Users\\kwonn\\mcp-hello-java\\target\\mcp-hello-java-1.0.0.jar"
      ]
    }
  }
}
```

### 2. Claude Desktop 재시작

설정을 추가하거나 JAR 파일을 업데이트한 후에는 Claude Desktop을 완전히 종료했다가 다시 시작해야 합니다.

## 테스트

Claude Code에서 다음과 같은 질문으로 서버를 테스트할 수 있습니다:

### 한국어 테스트
- "Java MCP 서버로 저를 환영해줄 수 있나요?"
- "Java 서버에서 현재 시간을 알려주세요"
- "Java MCP 도구로 25와 17을 더해주세요"
- "'안녕하세요'를 거꾸로 뒤집어주세요"
- "Java MCP 서버 정보를 알려주세요"

### English Tests
- "Can you greet me using the Java MCP server?"
- "What time is it according to the Java server?"
- "Add 25 and 17 using the Java MCP tools"
- "Reverse the string 'Hello World'"
- "What information can you tell me about the Java MCP server?"

## 사용 가능한 도구 (Available Tools)

1. **greet** - 인사 메시지 반환 (선택적으로 이름 포함)
2. **add** - 두 숫자를 더함
3. **getCurrentTime** - 현재 날짜와 시간을 ISO 형식으로 반환
4. **getServerInfo** - MCP 서버 정보 반환
5. **reverseString** - 입력 문자열을 거꾸로 뒤집음

## 문제 해결 (Troubleshooting)

### 서버가 Claude에 표시되지 않음
- `.mcp.json`의 경로가 절대 경로이고 올바른지 확인
- JAR 파일이 실제로 `target/` 디렉토리에 존재하는지 확인
- Claude Desktop을 완전히 종료하고 재시작

### 빌드 오류
- Java 17 이상이 설치되어 있는지 확인: `java -version`
- Maven이 설치되어 있는지 확인: `mvn -version`
- IntelliJ IDEA의 Maven 도구를 사용하는 것을 권장

### 런타임 오류
- `application.properties`에 `spring.main.web-application-type=none`이 설정되어 있는지 확인
- 로그 출력을 확인하여 오류 메시지 찾기

## 개발 (Development)

새로운 도구를 추가하려면:

1. `src/main/java/com/example/mcp/HelloService.java` 파일 열기
2. `@Tool` 어노테이션이 있는 새 메소드 추가
3. 프로젝트 재빌드: `mvn clean package`
4. Claude Desktop 재시작

## 참고 자료 (Resources)

- [Spring AI MCP Documentation](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-overview.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Java SDK GitHub](https://github.com/modelcontextprotocol/java-sdk)
