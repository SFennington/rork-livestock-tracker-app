import json
from datetime import datetime

# Read the original backup
with open(r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25.json', 'r') as f:
    backup = json.load(f)

print("="*80)
print("DATE RANGE ANALYSIS")
print("="*80)

# Get date ranges for egg production
egg_dates = [r['date'] for r in backup['data']['eggProduction']]
egg_start = min(egg_dates) if egg_dates else 'N/A'
egg_end = max(egg_dates) if egg_dates else 'N/A'
print(f"\nEgg Production Records:")
print(f"  Date range: {egg_start} to {egg_end}")
print(f"  Total records: {len(egg_dates)}")
print(f"  Total eggs laid: {sum(r.get('laid', r.get('count', 0)) for r in backup['data']['eggProduction']):,}")

# Get date ranges for income
income_egg_records = [r for r in backup['data']['income'] if r.get('type') == 'eggs']
if income_egg_records:
    income_dates = [r['date'] for r in income_egg_records]
    income_start = min(income_dates)
    income_end = max(income_dates)
    print(f"\nIncome (Egg) Records:")
    print(f"  Date range: {income_start} to {income_end}")
    print(f"  Total records: {len(income_egg_records)}")
    
    total_sold_qty = sum(r.get('quantity', 0) for r in income_egg_records if r.get('amount', 0) > 0)
    total_donated_qty = sum(r.get('quantity', 0) for r in income_egg_records if r.get('amount', 0) == 0)
    print(f"  Total eggs sold (qty field): {total_sold_qty:,}")
    print(f"  Total eggs donated (qty field): {total_donated_qty:,}")

# Check if income is BEFORE egg production started
print(f"\n" + "="*80)
print("TIMELINE CHECK")
print("="*80)

if egg_start and income_start:
    if income_start < egg_start:
        print(f"⚠️  Income records start BEFORE egg production records!")
        print(f"    Income starts: {income_start}")
        print(f"    Egg prod starts: {egg_start}")
        print(f"    This could explain the mismatch.")

# Show all income records by date
print(f"\n" + "="*80)
print("ALL INCOME RECORDS (chronological)")
print("="*80)

sorted_income = sorted(income_egg_records, key=lambda x: x['date'])
for rec in sorted_income:
    qty = rec.get('quantity', 0)
    amt = rec['amount']
    desc = rec.get('description', '')
    print(f"{rec['date']}: {qty:4} eggs @ ${amt:6.2f} - {desc}")
