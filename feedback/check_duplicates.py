import json
from collections import defaultdict

# Read the backup file
with open(r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25.json', 'r') as f:
    data = json.load(f)['data']

print("="*80)
print("CHECKING FOR DUPLICATE INCOME RECORDS")
print("="*80)

# Check for exact duplicates
seen = defaultdict(list)
for rec in data['income']:
    key = (rec['date'], rec['amount'], rec.get('quantity', 0), rec.get('description', ''))
    seen[key].append(rec['id'])

duplicates = {k: v for k, v in seen.items() if len(v) > 1}

if duplicates:
    print(f"\n❌ Found {len(duplicates)} sets of duplicate income records:")
    for (date, amt, qty, desc), ids in list(duplicates.items())[:10]:
        print(f"  {date} | ${amt} | {qty} eggs | '{desc}' → {len(ids)} copies")
else:
    print("\n✅ No exact duplicates found")

# Check if quantities look like they were entered as dozens instead of eggs
print("\n" + "="*80)
print("CHECKING IF QUANTITIES ARE IN WRONG UNITS")
print("="*80)

egg_income = [r for r in data['income'] if r.get('type') == 'eggs' and 'quantity' in r]
print(f"\nTotal egg income records: {len(egg_income)}")

# Sample some records
print("\nSample records (first 15):")
for i, rec in enumerate(egg_income[:15]):
    qty = rec.get('quantity', 0)
    amt = rec['amount']
    desc = rec.get('description', '')
    dozens = qty / 12
    price_per_dozen = amt / dozens if dozens > 0 else 0
    print(f"  {rec['date']}: {qty:4} eggs ({dozens:5.1f} doz) @ ${amt:6.2f} = ${price_per_dozen:.2f}/doz - {desc}")

# Check if prices make sense
print("\n" + "="*80)
print("PRICE ANALYSIS")
print("="*80)

prices_per_dozen = []
for rec in egg_income:
    if rec['amount'] > 0:
        qty = rec.get('quantity', 0)
        if qty > 0:
            dozens = qty / 12
            price_per_doz = rec['amount'] / dozens
            prices_per_dozen.append(price_per_doz)

if prices_per_dozen:
    avg_price = sum(prices_per_dozen) / len(prices_per_dozen)
    min_price = min(prices_per_dozen)
    max_price = max(prices_per_dozen)
    print(f"Average price per dozen: ${avg_price:.2f}")
    print(f"Min price per dozen: ${min_price:.2f}")
    print(f"Max price per dozen: ${max_price:.2f}")
    
    # If prices are way too low, quantities might be in eggs when they should be dozens
    if avg_price < 0.50:
        print("\n⚠️  Prices are suspiciously LOW - quantities might already be in eggs but should be in dozens")
        print("    (typical egg prices: $3-6 per dozen)")

# Total check
total_sold_qty = sum(r.get('quantity', 0) for r in data['income'] if r.get('type') == 'eggs' and r.get('amount', 0) > 0)
total_donated_qty = sum(r.get('quantity', 0) for r in data['income'] if r.get('type') == 'eggs' and r.get('amount', 0) == 0)
total_laid = sum(r.get('laid', r.get('count', 0)) for r in data['eggProduction'])

print(f"\n" + "="*80)
print("TOTALS")
print("="*80)
print(f"Total eggs laid: {total_laid:,}")
print(f"Total eggs sold: {total_sold_qty:,}")
print(f"Total eggs donated: {total_donated_qty:,}")
print(f"Total accounted for: {total_sold_qty + total_donated_qty:,}")
print(f"Difference: {(total_sold_qty + total_donated_qty) - total_laid:,}")

if total_sold_qty + total_donated_qty > total_laid:
    ratio = (total_sold_qty + total_donated_qty) / total_laid
    print(f"\n❌ PROBLEM: Sold/donated is {ratio:.2f}x more than laid!")
    
    # If the ratio is close to 12, they entered dozens as eggs
    if 10 < ratio < 14:
        print("\n💡 HYPOTHESIS: You entered DOZENS but the field expected EGGS")
        print("   Solution: Divide all income quantities by 12")
    elif ratio > 2:
        print("\n💡 HYPOTHESIS: You have duplicate records or imported the same data multiple times")
        print("   Solution: Remove duplicates")
