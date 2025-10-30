# Table Creation Tool - Usage Guide

## Overview

The `create_table` tool in the Python Utils MCP server allows you to create formatted ASCII/Unicode text tables from data. It uses the `tabulate` library to support multiple table formats suitable for console output, documentation, and reports.

## Tool Parameters

### Required Parameters

- **data** (array): Array of arrays representing table rows
  - If `headers` is not specified separately, the first row will be used as headers

### Optional Parameters

- **headers** (array of strings): Column headers
  - If not provided, the first row of `data` is used as headers

- **table_format** (string): Table format style
  - Default: `"grid"`
  - Available formats: `"plain"`, `"simple"`, `"github"`, `"grid"`, `"fancy_grid"`, `"pipe"`, `"orgtbl"`, `"jira"`, `"presto"`, `"pretty"`, `"psql"`, `"rst"`, `"mediawiki"`, `"html"`, `"latex"`

- **show_index** (boolean): Show row index numbers
  - Default: `false`

- **num_align** (string): Alignment for numeric columns
  - Default: `"right"`
  - Options: `"left"`, `"right"`, `"center"`, `"decimal"`

## Usage Examples

### Example 1: Simple Table with Separate Headers

```json
{
  "data": [
    ["Alice", 24, "Engineer"],
    ["Bob", 30, "Designer"],
    ["Charlie", 28, "Manager"]
  ],
  "headers": ["Name", "Age", "Role"],
  "table_format": "grid"
}
```

Output:
```
+---------+-------+----------+
| Name    |   Age | Role     |
+=========+=======+==========+
| Alice   |    24 | Engineer |
+---------+-------+----------+
| Bob     |    30 | Designer |
+---------+-------+----------+
| Charlie |    28 | Manager  |
+---------+-------+----------+
```

### Example 2: Table with First Row as Headers

```json
{
  "data": [
    ["Product", "Price", "Stock"],
    ["Laptop", 1200, 15],
    ["Mouse", 25, 150],
    ["Keyboard", 75, 80]
  ],
  "table_format": "grid"
}
```

Output:
```
+-----------+---------+---------+
| Product   |   Price |   Stock |
+===========+=========+=========+
| Laptop    |    1200 |      15 |
+-----------+---------+---------+
| Mouse     |      25 |     150 |
+-----------+---------+---------+
| Keyboard  |      75 |      80 |
+-----------+---------+---------+
```

### Example 3: GitHub-Flavored Markdown Format

```json
{
  "data": [
    ["Item", "Quantity", "Status"],
    ["Item A", 100, "Available"],
    ["Item B", 0, "Out of Stock"]
  ],
  "table_format": "github"
}
```

Output:
```
| Item   |   Quantity | Status       |
|--------|------------|--------------|
| Item A |        100 | Available    |
| Item B |          0 | Out of Stock |
```

### Example 4: Table with Row Indices

```json
{
  "data": [
    ["Task 1", "In Progress"],
    ["Task 2", "Completed"],
    ["Task 3", "Pending"]
  ],
  "headers": ["Task", "Status"],
  "table_format": "grid",
  "show_index": true
}
```

Output:
```
+----+--------+-------------+
|    | Task   | Status      |
+====+========+=============+
|  0 | Task 1 | In Progress |
+----+--------+-------------+
|  1 | Task 2 | Completed   |
+----+--------+-------------+
|  2 | Task 3 | Pending     |
+----+--------+-------------+
```

### Example 5: Simple Format (Lightweight)

```json
{
  "data": [
    ["Name", "Score"],
    ["Alice", 95],
    ["Bob", 87],
    ["Charlie", 92]
  ],
  "table_format": "simple"
}
```

Output:
```
Name       Score
-------  -------
Alice         95
Bob           87
Charlie       92
```

### Example 6: PSql Format (PostgreSQL Style)

```json
{
  "data": [
    ["ID", "Name", "Value"],
    [1, "Item A", 100.5],
    [2, "Item B", 250.75],
    [3, "Item C", 50.25]
  ],
  "table_format": "psql",
  "num_align": "right"
}
```

Output:
```
+------+--------+---------+
| ID   | Name   |   Value |
|------+--------+---------|
|    1 | Item A |  100.50 |
|    2 | Item B |  250.75 |
|    3 | Item C |   50.25 |
+------+--------+---------+
```

## Recommended Table Formats

### For Documentation
- **github**: Perfect for markdown files and GitHub READMEs
- **rst**: For reStructuredText documentation
- **mediawiki**: For MediaWiki documentation

### For Console Output
- **grid**: Clear borders, easy to read
- **simple**: Lightweight, minimal formatting
- **psql**: PostgreSQL-style tables
- **plain**: No formatting, just aligned columns

### For Export
- **html**: HTML table markup
- **latex**: LaTeX table format
- **jira**: JIRA-compatible markup

### For Advanced Formatting
- **fancy_grid**: Unicode box-drawing characters (may have encoding issues on some Windows consoles)
- **pretty**: Pretty table with box-drawing characters

## Common Use Cases

### 1. Display Data from API Response
```json
{
  "data": [
    ["User ID", "Username", "Status"],
    [1, "john_doe", "active"],
    [2, "jane_smith", "active"],
    [3, "bob_jones", "inactive"]
  ],
  "table_format": "grid"
}
```

### 2. Format CSV-like Data
```json
{
  "data": [
    ["Date", "Revenue", "Expenses", "Profit"],
    ["2025-01", 50000, 30000, 20000],
    ["2025-02", 55000, 32000, 23000],
    ["2025-03", 60000, 35000, 25000]
  ],
  "table_format": "psql",
  "num_align": "right"
}
```

### 3. Create Comparison Tables
```json
{
  "data": [
    ["Feature", "Plan A", "Plan B", "Plan C"],
    ["Storage", "10GB", "50GB", "Unlimited"],
    ["Users", 5, 25, "Unlimited"],
    ["Price", "$10", "$50", "$100"]
  ],
  "table_format": "github"
}
```

## Notes

- All table formats work correctly in MCP tool responses
- Some Unicode-heavy formats like `fancy_grid` may display incorrectly in Windows CMD/PowerShell with CP949 encoding
- For best compatibility across platforms, use: `grid`, `simple`, `github`, `psql`, or `plain`
- Numeric values are automatically right-aligned by default
- Empty data arrays will raise an error

## Installation

The `tabulate` dependency is already included in `requirements.txt`:

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install tabulate>=0.9.0
```
