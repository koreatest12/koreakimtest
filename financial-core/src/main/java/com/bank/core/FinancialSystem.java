package com.bank.core;
import java.sql.*;
import java.util.UUID;
public class FinancialSystem {
    public static void main(String[] args) throws Exception {
        OracleServerManager.restartInstance();
        try (Connection conn = OracleServerManager.getOracleConnection()) {
            Statement stmt = conn.createStatement();
            stmt.execute("CREATE TABLE CONTAINER_DATA (ID RAW(16) PRIMARY KEY, PAYLOAD VARCHAR2(255), TS TIMESTAMP)");
            
            System.out.println("📦 [DATA-LOAD] Injecting 100,000 records into Oracle mode...");
            PreparedStatement ps = conn.prepareStatement("INSERT INTO CONTAINER_DATA VALUES (RANDOM_UUID(), ?, CURRENT_TIMESTAMP)");
            for (int i = 1; i <= 100000; i++) {
                ps.setString(1, "VAL-" + i + "-" + UUID.randomUUID());
                ps.addBatch();
                if (i % 10000 == 0) ps.executeBatch();
            }
            ps.executeBatch();
            System.out.println("✅ [SUCCESS] 100,000 items loaded successfully.");
        }
    }
}
