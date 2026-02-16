package com.bank.core;
import java.sql.*;
import java.util.UUID;

public class FinancialSystem {
    private static final String URL = "jdbc:h2:mem:oracle_db;MODE=Oracle;DB_CLOSE_DELAY=-1";
    private static final int TOTAL = 100000;
    private static final int CHUNK_SIZE = 10000; // 분할 단위

    public static void main(String[] args) throws Exception {
        Class.forName("org.h2.Driver");
        try (Connection conn = DriverManager.getConnection(URL, "sa", "")) {
            setupSchema(conn);
            
            long startTime = System.currentTimeMillis();
            int processed = 0;

            // [분할 적재 시작]
            while (processed < TOTAL) {
                int currentChunk = Math.min(CHUNK_SIZE, TOTAL - processed);
                loadChunk(conn, processed + 1, currentChunk);
                processed += currentChunk;
                
                // 청크 단위 커밋 및 메모리 정리 시뮬레이션
                System.out.println("📦 [PARTITION] Progress: " + processed + "/" + TOTAL + " (Completed Chunk)");
            }

            // [데이터 병합]
            mergeData(conn);
            
            System.out.println("✅ [FINAL] Total Load Time: " + (System.currentTimeMillis() - startTime) + "ms");
        }
    }

    private static void setupSchema(Connection conn) throws SQLException {
        Statement stmt = conn.createStatement();
        stmt.execute("CREATE TABLE IF NOT EXISTS RAW_STAGING (ID RAW(16), CHUNK_ID INT, VAL NUMBER)");
        stmt.execute("CREATE TABLE IF NOT EXISTS MERGED_LEDGER (ID RAW(16) PRIMARY KEY, TOTAL_VAL NUMBER, TS TIMESTAMP)");
    }

    private static void loadChunk(Connection conn, int startIdx, int size) throws SQLException {
        String sql = "INSERT INTO RAW_STAGING (ID, CHUNK_ID, VAL) VALUES (RANDOM_UUID(), ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            conn.setAutoCommit(false); // 트랜잭션 분리
            for (int i = 0; i < size; i++) {
                ps.setInt(1, (startIdx + i) / CHUNK_SIZE);
                ps.setLong(2, (long)(Math.random() * 1000));
                ps.addBatch();
            }
            ps.executeBatch();
            conn.commit(); // 청크 단위로 물리적 커밋
        }
    }

    private static void mergeData(Connection conn) throws SQLException {
        System.out.println("🔄 [MERGE] Consolidating all partitioned chunks...");
        Statement stmt = conn.createStatement();
        stmt.execute("INSERT INTO MERGED_LEDGER SELECT ID, VAL, CURRENT_TIMESTAMP FROM RAW_STAGING");
    }
}
