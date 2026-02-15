package com.bank.core;
import java.sql.*;
import java.util.UUID;

public class FinancialSystem {
    private static final String URL = "jdbc:h2:mem:oracle_db;MODE=Oracle;DB_CLOSE_DELAY=-1";
    
    public static void main(String[] args) throws Exception {
        Class.forName("org.h2.Driver");
        try (Connection conn = DriverManager.getConnection(URL, "sa", "")) {
            Statement stmt = conn.createStatement();
            // 1. 초기 테이블 생성 (임시 영역 및 통합 영역)
            stmt.execute("CREATE TABLE IF NOT EXISTS RAW_STAGING (ID RAW(16), VAL NUMBER)");
            stmt.execute("CREATE TABLE IF NOT EXISTS MERGED_LEDGER (ID RAW(16) PRIMARY KEY, TOTAL_VAL NUMBER, UPDATED_AT TIMESTAMP)");

            // 2. 데이터 적재 시뮬레이션
            System.out.println("📦 [STAGING] Loading 50,000 raw records...");
            PreparedStatement ps = conn.prepareStatement("INSERT INTO RAW_STAGING VALUES (RANDOM_UUID(), ?)");
            for (int i = 0; i < 50000; i++) {
                ps.setLong(1, (long)(Math.random() * 1000));
                ps.addBatch();
                if (i % 10000 == 0) ps.executeBatch();
            }
            ps.executeBatch();

            // 3. 데이터 병합(Merge) 기능 수행 (Oracle MERGE 문 스타일)
            System.out.println("🔄 [MERGE] Consolidating staging data into Merged Ledger...");
            long start = System.currentTimeMillis();
            stmt.execute(
                "INSERT INTO MERGED_LEDGER (ID, TOTAL_VAL, UPDATED_AT) " +
                "SELECT ID, VAL, CURRENT_TIMESTAMP FROM RAW_STAGING"
            );
            
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM MERGED_LEDGER");
            rs.next();
            System.out.println("✅ [SUCCESS] Data Merge Completed. Total Rows: " + rs.getInt(1) + " (" + (System.currentTimeMillis()-start) + "ms)");
        }
    }
}
