package com.bank.core;
import java.sql.*;
import java.util.UUID;

public class FinancialSystem {
    public static void main(String[] args) throws Exception {
        // 1. 서버 재기동 기능 호출
        OracleServerManager.restartInstance();

        // 2. 재기동 후 데이터 연동
        try (Connection conn = OracleServerManager.getOracleConnection()) {
            Statement stmt = conn.createStatement();
            stmt.execute("CREATE TABLE ORA_LEDGER (TX_ID RAW(16) PRIMARY KEY, ACC_ID VARCHAR2(50), BAL NUMBER)");

            System.out.println("📦 [DATA] Injecting 100,000 enterprise records after reboot...");
            PreparedStatement ps = conn.prepareStatement("INSERT INTO ORA_LEDGER VALUES (RANDOM_UUID(), ?, ?)");
            
            long start = System.currentTimeMillis();
            for (int i = 1; i <= 100000; i++) {
                ps.setString(1, "ACC-" + i);
                ps.setLong(2, (long)(Math.random() * 5000000));
                ps.addBatch();
                if (i % 10000 == 0) ps.executeBatch();
            }
            ps.executeBatch();
            System.out.println("✅ [SUCCESS] Batch load completed in " + (System.currentTimeMillis() - start) + "ms");
        }
    }
}
