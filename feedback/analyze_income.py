import json
from collections import defaultdict

# Read the backup file
with open(r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25.json', 'r') as f:
    data = json.load(f)['data']

print("INCOME RECORDS ANALYSIS")
print("="*80)

# Group by amount == 0 (donated) vs amount > 0 (sold)
sold_records = [i for i in data['income'] if i.get('type') == 'eggs' and i.get('amount', 0) > 0]
donated_records = [i for i in data['income'] if i.get('type') == 'eggs' and i.get('amount', 0) == 0]

print(f"\nSOLD EGGS (amount > 0): {len(sold_records)} records")
total_sold_qty = sum(r.get('quantity', 0) for r in sold_records)
total_sold_amt = sum(r.get('amount', 0) for r in sold_records)
print(f"  Total Quantity: {total_sold_qty:,} eggs")
print(f"  Total Amount: ${total_sold_amt:,.2f}")

print(f"\nDONATED EGGS (amount = 0): {len(donated_records)} records")
total_donated_qty = sum(r.get('quantity', 0) for r in donated_records)
print(f"  Total Quantity: {total_donated_qty:,} eggs")

print("\nFirst few SOLD records:")
for i, r in enumerate(sold_records[:5]):
    print(f"  {i+1}. Date: {r['date']}, Qty: {r.get('quantity', 'N/A')}, Amt: ${r['amount']}, Desc: {r.get('description', '')}")

print("\nFirst few DONATED records:")
for i, r in enumerate(donated_records[:5]):
    print(f"  {i+1}. Date: {r['date']}, Qty: {r.get('quantity', 'N/A')}, Amt: ${r['amount']}, Desc: {r.get('description', '')}")

print("\n" + "="*80)
print("THE BUG:")
print("="*80)
print("Income records show quantity in EGGS but the app should be counting DOZENS!")
print(f"If these quantities are actually eggs: {total_sold_qty + total_donated_qty:,} eggs")
print(f"If converted to dozens: {(total_sold_qty + total_donated_qty) // 12:,} dozen")
print(f"Total eggs laid: 7,139")
print("\nThe 'quantity' field in income records appears to be in EGGS, not DOZENS")
