package com.company.core;
import org.slf4j.Logger; import org.slf4j.LoggerFactory;
public class Application {
    private static final Logger logger = LoggerFactory.getLogger(Application.class);
    public String getStatus() { return "Active"; }
    public static void main(String[] args) {
        logger.info("Starting Enterprise Service...");
        logger.info("System Status: " + new Application().getStatus());
    }
}
