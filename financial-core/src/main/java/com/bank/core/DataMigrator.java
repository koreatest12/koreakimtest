package com.bank.core;
import java.sql.*;
import java.util.*;

public class DataMigrator {
    public static void main(String[] args) throws Exception {
        // 1. Oracle 서버 재기동 시뮬레이션
        System.out.println("🔄 [SYS] Restarting Oracle Instance for Migration...");
        
        // 2. 소스 데이터(Maven/H2) 및 타겟(Oracle) 연결
        Class.forName("org.h2.Driver");
        Connection sourceConn = DriverManager.getConnection("jdbc:h2:mem:source_db;DB_CLOSE_DELAY=-1", "sa", "");
        Connection oracleConn = DriverManager.getConnection("jdbc:h2:mem:oracle_db;MODE=Oracle;DB_CLOSE_DELAY=-1", "sa", "");

        // 3. 스키마 초기화
        Statement srcStmt = sourceConn.createStatement();
        srcStmt.execute("CREATE TABLE MAVEN_RAW (ID INT, VAL VARCHAR(255))");
        
        Statement oraStmt = oracleConn.createStatement();
        oraStmt.execute("CREATE TABLE ORA_FINANCIAL_CORE (ORA_ID RAW(16) PRIMARY KEY, DATA_VAL VARCHAR2(255), MIGRATED_AT TIMESTAMP)");

        // 4. 대량 데이터 생성 (Maven side)
        System.out.println("📦 [STEP 1] Generating 100,000 Maven Raw Records...");
        PreparedStatement ps = sourceConn.prepareStatement("INSERT INTO MAVEN_RAW VALUES (?, ?)");
        for(int i=0; i<100000; i++) {
            ps.setInt(1, i);
            ps.setString(2, "FIN-DATA-" + UUID.randomUUID());
            ps.addBatch();
            if(i % 10000 == 0) ps.executeBatch();
        }
        ps.executeBatch();

        // 5. Oracle로 데이터 이관 (Data Migration)
        System.out.println("🚀 [STEP 2] Migrating Data to Oracle Server...");
        long start = System.currentTimeMillis();
        ResultSet rs = srcStmt.executeQuery("SELECT * FROM MAVEN_RAW");
        PreparedStatement oraPs = oracleConn.prepareStatement(
            "INSERT INTO ORA_FINANCIAL_CORE VALUES (RANDOM_UUID(), ?, CURRENT_TIMESTAMP)");

        int count = 0;
        while(rs.next()) {
            oraPs.setString(1, rs.getString("VAL"));
            oraPs.addBatch();
            if(++count % 10000 == 0) oraPs.executeBatch();
        }
        oraPs.executeBatch();
        
        System.out.println("✅ [COMPLETED] 100,000 records migrated to Oracle in " + (System.currentTimeMillis()-start) + "ms");
    }
}
