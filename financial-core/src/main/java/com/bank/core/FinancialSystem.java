package com.bank.core;
import java.sql.*;
import java.util.UUID;
import java.util.concurrent.*;

public class FinancialSystem {
    private static final int BATCH_SIZE = 5000;
    private static final int TOTAL_RECORDS = 50000; // 5만 건으로 확대

    public static void main(String[] args) throws Exception {
        DatabaseManager.initSchema();
        long start = System.currentTimeMillis();
        
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            PreparedStatement pstmt = conn.prepareStatement(
                "INSERT INTO USERS (ID, PASSWORD_HASH, BALANCE) VALUES (?, ?, ?)");
            
            for (int i = 1; i <= TOTAL_RECORDS; i++) {
                pstmt.setString(1, "USER_" + i);
                pstmt.setString(2, "HASH_" + UUID.randomUUID());
                pstmt.setLong(3, 1000000);
                pstmt.addBatch();
                if (i % BATCH_SIZE == 0) pstmt.executeBatch();
            }
            pstmt.executeBatch();
            conn.commit();
        }
        System.out.println("✅ Batch Injection: " + TOTAL_RECORDS + " records in " + (System.currentTimeMillis()-start) + "ms");
    }
}
