package com.bank.core;
import java.sql.*;
public class OracleServerManager {
    public static void logStatus(String msg) {
        System.out.println("📢 [SYSTEM-LOG] " + msg);
    }
    public static Connection getOracleConnection() throws Exception {
        Class.forName("org.h2.Driver");
        // DB_CLOSE_DELAY=-1을 통해 재기동 시뮬레이션 중에도 메모리 데이터 유지
        return DriverManager.getConnection("jdbc:h2:mem:oracle_db;MODE=Oracle;DB_CLOSE_DELAY=-1", "sa", "");
    }
}
