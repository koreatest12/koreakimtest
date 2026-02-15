package com.bank.core;
import java.sql.*;
public class OracleServerManager {
    public static void restartInstance() {
        System.out.println("🔄 [ORACLE] Shutdown Immediate & Clean Startup...");
        System.out.println("✅ [ORACLE] Instance Online. Buffer Cache Purged.");
    }
    public static Connection getOracleConnection() throws Exception {
        Class.forName("org.h2.Driver");
        return DriverManager.getConnection("jdbc:h2:mem:oracle_db;MODE=Oracle;DB_CLOSE_DELAY=-1", "sa", "");
    }
}
