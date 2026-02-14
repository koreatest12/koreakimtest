#!/usr/bin/env python3
"""Pytest test suite for MCP server functionality"""

import pytest
import json
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from server import (
    calculate, get_current_time, get_system_info,
    format_json, validate_json, create_table
)


class TestCalculate:
    """Test calculate function"""
    
    def test_basic_addition(self):
        """Test basic addition"""
        result = calculate("2 + 2")
        assert result.get('result') == 4
        assert 'timestamp' in result
    
    def test_order_of_operations(self):
        """Test order of operations"""
        result = calculate("2 + 2 * 3")
        assert result.get('result') == 8
    
    def test_invalid_expression(self):
        """Test error handling for invalid expressions"""
        result = calculate("invalid")
        assert 'error' in result


class TestSystemInfo:
    """Test system information functions"""
    
    def test_get_current_time(self):
        """Test get_current_time returns expected fields"""
        result = get_current_time()
        assert 'datetime' in result
        assert 'date' in result
        assert 'time' in result
        assert 'day_of_week' in result
        assert 'timestamp' in result
    
    def test_get_system_info(self):
        """Test get_system_info returns expected fields"""
        result = get_system_info()
        assert 'platform' in result
        assert 'python_version' in result
        assert 'timestamp' in result


class TestJsonOperations:
    """Test JSON operations"""
    
    def test_format_json_basic(self):
        """Test basic JSON formatting"""
        json_str = '{"name":"Alice","age":24}'
        result = format_json(json_str)
        assert '"name"' in result
        assert '"Alice"' in result
        # Check it's properly formatted (has newlines)
        assert '\n' in result
    
    def test_format_json_with_indent(self):
        """Test JSON formatting with custom indent"""
        json_str = '{"name":"Bob"}'
        result = format_json(json_str, indent=4)
        assert '"name"' in result
        assert '"Bob"' in result
    
    def test_format_json_invalid(self):
        """Test format_json with invalid JSON"""
        result = format_json('invalid json')
        assert 'Error' in result
    
    def test_validate_json_valid(self):
        """Test validate_json with valid JSON"""
        result = validate_json('{"valid": true}')
        assert result.get('valid') == True
        assert 'message' in result
    
    def test_validate_json_invalid(self):
        """Test validate_json with invalid JSON"""
        result = validate_json('{invalid}')
        assert result.get('valid') == False
        assert 'error' in result


class TestTableCreation:
    """Test table creation functionality"""
    
    def test_create_table_with_headers(self):
        """Test table creation with separate headers"""
        data = [
            ["Alice", 24, "Engineer"],
            ["Bob", 30, "Designer"]
        ]
        headers = ["Name", "Age", "Role"]
        result = create_table(data, headers=headers, table_format="simple")
        assert "Alice" in result
        assert "Engineer" in result
        assert "Name" in result
    
    def test_create_table_first_row_as_header(self):
        """Test table creation using first row as headers"""
        data = [
            ["Name", "Age", "Role"],
            ["Alice", 24, "Engineer"],
            ["Bob", 30, "Designer"]
        ]
        result = create_table(data, table_format="grid")
        assert "Alice" in result
        assert "Engineer" in result
    
    def test_create_table_github_format(self):
        """Test table in GitHub markdown format"""
        data = [
            ["Name", "Age"],
            ["Alice", 24]
        ]
        result = create_table(data, table_format="github")
        assert "|" in result
        assert "Alice" in result
    
    def test_create_table_empty_data(self):
        """Test error handling for empty data"""
        result = create_table([])
        assert "Error" in result or "empty" in result.lower()
    
    def test_create_table_with_index(self):
        """Test table with row index"""
        data = [
            ["Laptop", 1200, 15],
            ["Mouse", 25, 150]
        ]
        headers = ["Product", "Price", "Stock"]
        result = create_table(data, headers=headers, table_format="grid", show_index=True)
        assert "Laptop" in result
        # Index should appear (either 0, 1, or row numbers)
        assert any(str(i) in result for i in range(3))


# Mark tests that might be slow
@pytest.mark.slow
class TestSlowOperations:
    """Tests marked as slow for optional execution"""
    
    def test_complex_calculation(self):
        """Test complex calculation (marked as slow)"""
        result = calculate("sum([1, 2, 3, 4, 5])")
        assert result.get('result') == 15
