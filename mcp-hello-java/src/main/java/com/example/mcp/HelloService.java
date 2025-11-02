package com.example.mcp;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Simple MCP service providing example tools
 */
@Service
public class HelloService {

    private final Map<String, String> data = new HashMap<>();

    @PostConstruct
    public void init() {
        // Initialize with some sample data
        data.put("greeting", "Hello from Java MCP Server!");
        data.put("version", "1.0.0");
        data.put("language", "Java 17");
    }

    /**
     * Simple greeting tool
     */
    @Tool(name = "greet", description = "Returns a greeting message with optional name")
    public String greet(String name) {
        if (name == null || name.trim().isEmpty()) {
            return data.get("greeting");
        }
        return String.format("Hello, %s! Welcome to the Java MCP Server.", name);
    }

    /**
     * Add two numbers
     */
    @Tool(name = "add", description = "Adds two numbers and returns the result")
    public int add(int a, int b) {
        return a + b;
    }

    /**
     * Get current date and time
     */
    @Tool(name = "getCurrentTime", description = "Returns the current date and time in ISO format")
    public String getCurrentTime() {
        return LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    /**
     * Get server information
     */
    @Tool(name = "getServerInfo", description = "Returns information about the MCP server")
    public Map<String, String> getServerInfo() {
        Map<String, String> info = new HashMap<>(data);
        info.put("uptime", "Available since startup");
        info.put("tools", "greet, add, getCurrentTime, getServerInfo, reverseString");
        return info;
    }

    /**
     * Reverse a string
     */
    @Tool(name = "reverseString", description = "Reverses the input string")
    public String reverseString(String input) {
        if (input == null) {
            return "";
        }
        return new StringBuilder(input).reverse().toString();
    }
}
