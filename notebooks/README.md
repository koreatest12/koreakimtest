# Notebooks

Jupyter notebooks for data analysis, generation, and exploration.

## Available Notebooks

### korean_customer_data_generator.ipynb

Generates synthetic Korean-style customer datasets for testing and analytics.

**Features:**
- Korean demographics (names, addresses, phone numbers)
- Financial profiles (income, credit scores, spending patterns)
- Behavioral data (activity, churn risk, loyalty tiers)
- Korean payment methods (cards, banks, 간편결제)

**Output Files:**
- CSV: `../data/raw/customers_ko_YYYYMMDD-HHMMSS.csv`
- Excel: `../data/raw/customers_ko_YYYYMMDD-HHMMSS.xlsx` (with formatting)

**Configuration:**
```python
N = 1000            # Number of customers
SEED = 42           # Random seed
EXCHANGE_RATE = 1350  # USD to KRW
```

**Usage:**
1. Install dependencies: `pip install pandas openpyxl xlsxwriter matplotlib seaborn`
2. Open notebook in Jupyter Lab or VS Code
3. Adjust configuration parameters in second cell
4. Run all cells

**Dataset Schema (26 columns):**

| Column | Type | Description |
|--------|------|-------------|
| customer_id | string | Unique customer identifier |
| name_ko | string | Korean name (성 + 이름) |
| gender | string | M/F |
| birthdate | date | ISO format |
| age | int | 18-75 |
| email | string | Generated from name |
| phone | string | Korean format (010-XXXX-XXXX) |
| address_city | string | Korean city |
| address_district | string | District (구) |
| address_detail | string | Street and number |
| signup_date | date | Account creation date |
| last_active_date | date | Last activity |
| is_active | bool | Active within 7-90 days |
| churn_risk | float | 0.01-0.95 churn probability |
| income_monthly_krw | int | Monthly income (KRW) |
| avg_monthly_spend | int | Average monthly spending |
| total_orders | int | Number of orders |
| last_order_value | int | Last order amount (KRW) |
| credit_score | int | 350-950 |
| loyalty_tier | string | Basic/Silver/Gold/Platinum/Diamond |
| preferred_channel | string | kakao/sms/email/push/phone |
| segment | string | Customer segment |
| marketing_opt_in | bool | Marketing consent |
| payment_method_primary | string | Preferred payment method |
| bank_name | string | Korean bank |
| card_brand | string | Card brand |

## Setup

### Requirements

```bash
pip install jupyter pandas openpyxl xlsxwriter matplotlib seaborn
```

### Running Notebooks

**Jupyter Lab:**
```bash
cd C:\Users\kwonn
jupyter lab
# Navigate to notebooks/ directory
```

**VS Code:**
1. Install "Jupyter" extension
2. Open `.ipynb` file
3. Select Python kernel
4. Run cells with Shift+Enter

### Output Directory

Generated files are saved to `../data/raw/` (relative to notebook location).

Ensure the directory exists:
```bash
mkdir -p C:\Users\kwonn\data\raw
```
