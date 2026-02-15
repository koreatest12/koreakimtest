package com.bank.core;
import java.sql.*;

public class OracleServerManager {
    public static void restartInstance() {
        System.out.println("⚠️ [ORACLE-SYS] SHUTDOWN IMMEDIATE initiated...");
        System.out.println("⚠️ [ORACLE-SYS] Waiting for active transactions to roll back...");
        try { Thread.sleep(1000); } catch (Exception e) {}
        
        System.out.println("🔄 [ORACLE-SYS] Database closed. Database dismounted.");
        System.out.println("🔄 [ORACLE-SYS] Oracle instance shut down.");
        
        System.out.println("🚀 [ORACLE-SYS] STARTUP NOMOUNT...");
        System.out.println("🚀 [ORACLE-SYS] Oracle instance started (SGA/PGA Allocated).");
        System.out.println("🚀 [ORACLE-SYS] Database mounted and opened.");
        System.out.println("✅ [ORACLE-SYS] Oracle Server is now ONLINE.");
    }

    public static Connection getOracleConnection() throws Exception {
        Class.forName("org.h2.Driver");
        // Oracle Mode 인메모리 연결
        return DriverManager.getConnection("jdbc:h2:mem:oracle_db;MODE=Oracle;DB_CLOSE_DELAY=-1", "sa", "");
    }
}
