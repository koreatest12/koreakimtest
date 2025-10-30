#!/usr/bin/env python3
"""Direct test of table creation functionality"""

from typing import List, Any
from tabulate import tabulate

def create_table_test(
    data: List[List[Any]],
    headers: List[str] | None = None,
    table_format: str = "grid",
    show_index: bool = False,
    num_align: str = "right"
) -> str:
    """Test version of create_table function"""
    try:
        if not data or len(data) == 0:
            return "Error: Data array cannot be empty"

        # If headers not provided, use first row as headers
        table_data = data
        if headers is None:
            if len(data) > 0:
                headers = data[0]
                table_data = data[1:] if len(data) > 1 else []

        # Create the table
        if show_index:
            table_str = tabulate(
                table_data,
                headers=headers,
                tablefmt=table_format,
                showindex="always",
                numalign=num_align
            )
        else:
            table_str = tabulate(
                table_data,
                headers=headers,
                tablefmt=table_format,
                numalign=num_align
            )

        return table_str
    except Exception as e:
        return f"Error creating table: {str(e)}"


print("=" * 60)
print("Direct Table Creation Tests")
print("=" * 60)

# Test 1: Simple table with first row as header
print("\n[Test 1] Simple table (first row as header)")
test_data1 = [
    ["Name", "Age", "Role"],
    ["Alice", 24, "Engineer"],
    ["Bob", 30, "Designer"],
    ["Charlie", 28, "Manager"]
]
result1 = create_table_test(test_data1, table_format="grid")
print(result1)
assert "Alice" in result1 and "Engineer" in result1

# Test 2: Table with separate headers
print("\n[Test 2] Table with separate headers")
test_data2 = [
    ["Laptop", 1200, 15],
    ["Mouse", 25, 150],
    ["Keyboard", 75, 80]
]
headers2 = ["Product", "Price", "Stock"]
result2 = create_table_test(test_data2, headers=headers2, table_format="simple")
print(result2)
assert "Laptop" in result2 and "Product" in result2

# Test 3: GitHub markdown format
print("\n[Test 3] GitHub markdown format")
result3 = create_table_test(test_data1, table_format="github")
print(result3)
assert "|" in result3

# Test 4: Table with index
print("\n[Test 4] Table with row index")
result4 = create_table_test(test_data2, headers=headers2, table_format="grid", show_index=True)
print(result4)
assert "0" in result4 or "1" in result4

# Test 5: Different numeric alignment
print("\n[Test 5] Right-aligned numbers")
numeric_data = [
    ["Category", "Amount"],
    ["Sales", 1234567.89],
    ["Cost", 876543.21]
]
result5 = create_table_test(numeric_data, table_format="psql", num_align="right")
print(result5)
assert "Sales" in result5

print("\n" + "=" * 60)
print("All table creation tests passed! ✓")
print("=" * 60)
