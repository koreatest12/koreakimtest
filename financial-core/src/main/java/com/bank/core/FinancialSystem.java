package com.bank.core;
import java.sql.*;
import java.util.UUID;

public class FinancialSystem {
    public static void main(String[] args) throws Exception {
        DatabaseManager.initSchema();
        System.out.println("🏦 Database Schema Initialized from Resource File");
        
        int total = 50000;
        int batchSize = 5000;
        
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            PreparedStatement pstmt = conn.prepareStatement("INSERT INTO USERS (ID, PASSWORD_HASH, BALANCE) VALUES (?, ?, ?)");
            
            long start = System.currentTimeMillis();
            for (int i = 1; i <= total; i++) {
                pstmt.setString(1, "USR-" + UUID.randomUUID().toString().substring(0,8));
                pstmt.setString(2, "HASH-" + i);
                pstmt.setLong(3, 1000000);
                pstmt.addBatch();
                if (i % batchSize == 0) pstmt.executeBatch();
            }
            pstmt.executeBatch();
            conn.commit();
            System.out.println("✅ Successfully injected " + total + " records in " + (System.currentTimeMillis() - start) + "ms");
        }
    }
}
