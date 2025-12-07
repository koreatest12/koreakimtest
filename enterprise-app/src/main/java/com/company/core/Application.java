package com.company.core;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Enterprise Application Entry Point.
 */
public class Application {
    private static final Logger logger = LoggerFactory.getLogger(Application.class);
    
    /**
     * Get app status.
     * @return status string
     */
    public String getStatus() { return "Active"; }
    
    /**
     * Main execution.
     * @param args arguments
     */
    public static void main(String[] args) {
        logger.info("Starting Enterprise Service...");
        logger.info("System Status: " + new Application().getStatus());
    }
}
