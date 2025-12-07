package com.company.core;
import org.junit.jupiter.api.Test; import static org.junit.jupiter.api.Assertions.*;
class ApplicationTest {
    @Test void testStatus() { assertEquals("Active", new Application().getStatus()); }
}
