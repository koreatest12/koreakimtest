#!/usr/bin/env python3
"""Simple test for basic table functionality"""

from tabulate import tabulate

# Test basic formats that work well on all platforms
print("Test: Basic table formats")
print("=" * 60)

data = [
    ["Alice", 24, "Engineer"],
    ["Bob", 30, "Designer"],
    ["Charlie", 28, "Manager"]
]
headers = ["Name", "Age", "Role"]

# Safe formats for Windows console
safe_formats = ["plain", "simple", "github", "grid", "pipe", "psql", "rst"]

for fmt in safe_formats:
    print(f"\nFormat: {fmt}")
    print("-" * 40)
    try:
        result = tabulate(data, headers=headers, tablefmt=fmt, numalign="right")
        print(result)
    except Exception as e:
        print(f"Error: {e}")

print("\n" + "=" * 60)
print("Test: Table with index")
print("=" * 60)
result_with_index = tabulate(data, headers=headers, tablefmt="grid", showindex="always")
print(result_with_index)

print("\nAll safe format tests completed!")
