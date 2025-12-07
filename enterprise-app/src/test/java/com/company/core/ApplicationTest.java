package com.company.core;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class ApplicationTest {
    @Test
    void testStatus() {
        Application app = new Application();
        assertEquals("Active", app.getStatus());
    }
}
