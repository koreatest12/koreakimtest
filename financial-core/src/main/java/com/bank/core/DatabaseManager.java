package com.bank.core;
import java.sql.*;
public class DatabaseManager {
    public static Connection getConnection() throws Exception {
        // ClassNotFoundException 방지를 위해 명시적 로드
        Class.forName("org.h2.Driver");
        return DriverManager.getConnection("jdbc:h2:mem:fin_db;DB_CLOSE_DELAY=-1", "sa", "");
    }
    public static void initSchema() throws Exception {
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE USERS (ID VARCHAR(50) PRIMARY KEY, PASSWORD_HASH VARCHAR(100), BALANCE BIGINT)");
            stmt.execute("CREATE TABLE AUDIT_LOGS (ID IDENTITY PRIMARY KEY, ACTION VARCHAR(50), TS TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        }
    }
}
