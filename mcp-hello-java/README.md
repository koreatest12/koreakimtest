# MCP Hello Java

Simple Model Context Protocol (MCP) server implementation in Java using Spring AI.

## Overview

This is a basic MCP server that demonstrates how to create tools using the Spring AI MCP SDK. It provides several example tools for interacting with Claude and other AI assistants.

## Available Tools

- `greet` - Returns a greeting message with optional name parameter
- `add` - Adds two numbers and returns the result
- `getCurrentTime` - Returns the current date and time in ISO format
- `getServerInfo` - Returns information about the MCP server
- `reverseString` - Reverses the input string

## Requirements

- Java 17 or later
- Maven 3.6+

## Setup

### 1. Build the Project

```bash
cd mcp-hello-java
mvn clean package
```

This will create an executable JAR file in the `target/` directory.

### 2. Configure Claude Desktop

Add the following configuration to your `.mcp.json` file (typically located at `C:\Users\<username>\.mcp.json` on Windows):

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

**Note**: Update the path to match your actual installation directory.

### 3. Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

## Testing

You can test the MCP server by asking Claude questions like:

- "Can you greet me using the Java MCP server?"
- "What time is it according to the Java server?"
- "Add 15 and 27 using the Java MCP tools"
- "Reverse the string 'Hello World'"
- "What information can you tell me about the Java MCP server?"

## Project Structure

```
mcp-hello-java/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── example/
│       │           └── mcp/
│       │               ├── McpHelloJavaApplication.java  # Main application
│       │               └── HelloService.java              # Tool implementations
│       └── resources/
│           └── application.properties                     # Configuration
├── pom.xml                                                # Maven dependencies
└── README.md
```

## Technology Stack

- **Java 17** - Programming language
- **Spring Boot 3.4.1** - Application framework
- **Spring AI 1.0.0-M5** - MCP SDK integration
- **Maven** - Build tool

## How It Works

1. The application runs as a non-web Spring Boot application (`spring.main.web-application-type=none`)
2. It communicates via stdio (standard input/output) with Claude Desktop
3. Tools are defined using the `@Tool` annotation in the `HelloService` class
4. Spring AI automatically registers and exposes these tools via the MCP protocol
5. Claude can discover and invoke these tools during conversations

## Development

To modify or add new tools:

1. Add new methods to `HelloService.java` with the `@Tool` annotation
2. Rebuild the project: `mvn clean package`
3. Restart Claude Desktop to load the updated server

## Troubleshooting

- **Server not appearing in Claude**: Check that the path in `.mcp.json` is correct and absolute
- **Build errors**: Ensure you have Java 17+ and Maven 3.6+ installed
- **Runtime errors**: Check that `spring.main.web-application-type=none` is set in `application.properties`

## License

MIT
