#!/usr/bin/env python3
"""Test script for create_table functionality"""

from tabulate import tabulate

# Test 1: Simple table with headers
print("=" * 60)
print("Test 1: Simple table with separate headers")
print("=" * 60)
data1 = [
    ["Alice", 24, "Engineer"],
    ["Bob", 30, "Designer"],
    ["Charlie", 28, "Manager"]
]
headers1 = ["Name", "Age", "Role"]
table1 = tabulate(data1, headers=headers1, tablefmt="grid")
print(table1)
print()

# Test 2: Table with first row as headers
print("=" * 60)
print("Test 2: Table with first row as headers")
print("=" * 60)
data2 = [
    ["Product", "Price", "Stock"],
    ["Laptop", 1200, 15],
    ["Mouse", 25, 150],
    ["Keyboard", 75, 80]
]
table2 = tabulate(data2[1:], headers=data2[0], tablefmt="grid")
print(table2)
print()

# Test 3: Different table formats
print("=" * 60)
print("Test 3: Different table formats")
print("=" * 60)

formats = ["plain", "simple", "github", "grid", "fancy_grid", "pipe", "psql"]
sample_data = [
    ["Item A", 100, 5],
    ["Item B", 250, 10]
]
sample_headers = ["Item", "Price", "Qty"]

for fmt in formats:
    print(f"\nFormat: {fmt}")
    print("-" * 40)
    print(tabulate(sample_data, headers=sample_headers, tablefmt=fmt))

# Test 4: Table with index
print("\n" + "=" * 60)
print("Test 4: Table with row index")
print("=" * 60)
table4 = tabulate(data1, headers=headers1, tablefmt="grid", showindex="always")
print(table4)
print()

# Test 5: Numeric alignment
print("=" * 60)
print("Test 5: Numeric alignment (right)")
print("=" * 60)
numeric_data = [
    ["Total Sales", 1234567.89],
    ["Total Cost", 876543.21],
    ["Profit", 358024.68]
]
numeric_headers = ["Category", "Amount"]
table5 = tabulate(numeric_data, headers=numeric_headers, tablefmt="grid", numalign="right")
print(table5)
print()

print("All tests completed successfully!")
