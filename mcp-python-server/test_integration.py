#!/usr/bin/env python3
"""Integration test for all MCP server tools"""

import sys
sys.path.insert(0, '.')

from server import (
    calculate, get_current_time, get_system_info,
    format_json, validate_json, create_table
)

print("=" * 60)
print("MCP Server Integration Tests")
print("=" * 60)

# Test 1: Calculate
print("\n[1/6] Testing calculate...")
result = calculate("2 + 2 * 3")
print(f"✓ Result: {result.get('result')} (expected: 8)")
assert result.get('result') == 8, "Calculate test failed"

# Test 2: Get current time
print("\n[2/6] Testing get_current_time...")
result = get_current_time()
print(f"✓ Current date: {result.get('date')}")
assert 'datetime' in result, "Get current time test failed"

# Test 3: Get system info
print("\n[3/6] Testing get_system_info...")
result = get_system_info()
print(f"✓ Platform: {result.get('platform')}")
assert 'platform' in result, "Get system info test failed"

# Test 4: Format JSON
print("\n[4/6] Testing format_json...")
result = format_json('{"name":"Alice","age":24}')
print("✓ JSON formatted successfully")
assert '"name"' in result, "Format JSON test failed"

# Test 5: Validate JSON
print("\n[5/6] Testing validate_json...")
result = validate_json('{"valid": true}')
print(f"✓ JSON validation: {result.get('valid')}")
assert result.get('valid') == True, "Validate JSON test failed"

# Test 6: Create table
print("\n[6/6] Testing create_table...")
test_data = [
    ["Name", "Age", "Role"],
    ["Alice", 24, "Engineer"],
    ["Bob", 30, "Designer"]
]
result = create_table(test_data, table_format="simple")
print("✓ Table created:")
print(result)
assert "Alice" in result, "Create table test failed"
assert "Engineer" in result, "Create table test failed"

print("\n" + "=" * 60)
print("All integration tests passed! ✓")
print("=" * 60)
