package com.bank.core;
import java.sql.*;
import java.nio.file.*;
import java.io.InputStream;
import java.util.Scanner;

public class DatabaseManager {
    public static Connection getConnection() throws Exception {
        Class.forName("org.h2.Driver");
        return DriverManager.getConnection("jdbc:h2:mem:fin_db;DB_CLOSE_DELAY=-1", "sa", "");
    }
    public static void initSchema() throws Exception {
        try (Connection conn = getConnection(); 
             Statement stmt = conn.createStatement();
             InputStream is = DatabaseManager.class.getResourceAsStream("/sql/schema.sql")) {
            if (is == null) throw new RuntimeException("Schema file not found!");
            String sql = new Scanner(is).useDelimiter("\\A").next();
            stmt.execute(sql);
        }
    }
}
