package com.bank.core;
import java.sql.*;
import java.util.UUID;
public class FinancialSystem {
    public static void main(String[] args) throws Exception {
        try (Connection conn = OracleServerManager.getOracleConnection()) {
            Statement stmt = conn.createStatement();
            // 테이블이 없으면 생성 (재기동 후 체크용)
            stmt.execute("CREATE TABLE IF NOT EXISTS CONTAINER_DATA (ID RAW(16) PRIMARY KEY, PAYLOAD VARCHAR2(255), TS TIMESTAMP)");
            
            // 현재 데이터 개수 확인
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM CONTAINER_DATA");
            rs.next();
            int currentCount = rs.getInt(1);
            
            String mode = (currentCount == 0) ? "INITIAL" : "RECOVERY/POST-RESTART";
            OracleServerManager.logStatus("Current Data Rows: " + currentCount + " | Mode: " + mode);

            System.out.println("📦 [DATA-LOAD] Injecting 50,000 records...");
            PreparedStatement ps = conn.prepareStatement("INSERT INTO CONTAINER_DATA VALUES (RANDOM_UUID(), ?, CURRENT_TIMESTAMP)");
            for (int i = 1; i <= 50000; i++) {
                ps.setString(1, mode + "-VAL-" + i + "-" + UUID.randomUUID().toString().substring(0,8));
                ps.addBatch();
                if (i % 5000 == 0) ps.executeBatch();
            }
            ps.executeBatch();
            
            rs = stmt.executeQuery("SELECT COUNT(*) FROM CONTAINER_DATA");
            rs.next();
            System.out.println("✅ [SUCCESS] Total Data Rows after this run: " + rs.getInt(1));
        }
    }
}
