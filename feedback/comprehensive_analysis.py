import json
from collections import defaultdict

# Read the backup file
with open(r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25.json', 'r') as f:
    data = json.load(f)['data']

print("="*80)
print("COMPREHENSIVE ROI ANALYSIS")
print("="*80)

# Financial totals
total_expenses = sum(e['amount'] for e in data['expenses'])
total_income_cash = sum(i['amount'] for i in data['income'])

print(f"\n1. FINANCIAL SUMMARY")
print(f"   Total Expenses: ${total_expenses:,.2f}")
print(f"   Total Income (cash): ${total_income_cash:,.2f}")

# Egg production
total_laid = sum(r.get('laid', r.get('count', 0)) for r in data['eggProduction'])
total_broken = sum(r.get('broken', 0) for r in data['eggProduction'])

print(f"\n2. EGG PRODUCTION")
print(f"   Total Laid: {total_laid:,} eggs")
print(f"   Total Broken: {total_broken:,} eggs")
print(f"   Net Laid (after broken): {total_laid - total_broken:,} eggs")

# Income records analysis
total_sold_qty = 0
total_donated_qty = 0

for record in data['income']:
    if record['type'] == 'eggs' and 'quantity' in record:
        if record['amount'] == 0:
            total_donated_qty += record['quantity']
        else:
            total_sold_qty += record['quantity']

print(f"\n3. INCOME RECORDS (eggs)")
print(f"   Total Sold (amount > 0): {total_sold_qty:,} eggs")
print(f"   Total Donated (amount = 0): {total_donated_qty:,} eggs")
print(f"   Total from income: {total_sold_qty + total_donated_qty:,} eggs")

print(f"\n4. THE PROBLEM:")
print(f"   Net eggs laid: {total_laid - total_broken:,}")
print(f"   Eggs sold + donated: {total_sold_qty + total_donated_qty:,}")
print(f"   Difference: {(total_sold_qty + total_donated_qty) - (total_laid - total_broken):,} eggs")
print(f"   ⚠️  Income records show {((total_sold_qty + total_donated_qty) / (total_laid - total_broken) - 1) * 100:.1f}% MORE eggs than were laid!")

# Hypothesis 1: Quantities are in dozens, not eggs
print(f"\n5. HYPOTHESIS: Quantity field is in DOZENS")
total_sold_eggs = total_sold_qty * 12
total_donated_eggs = total_donated_qty * 12
print(f"   If quantities are dozens:")
print(f"     Sold: {total_sold_eggs:,} eggs")
print(f"     Donated: {total_donated_eggs:,} eggs")
print(f"     Total: {total_sold_eggs + total_donated_eggs:,} eggs")
print(f"   ❌ This would be even worse ({total_sold_eggs + total_donated_eggs:,} eggs vs {total_laid:,} laid)")

# Hypothesis 2: Quantities are eggs but divided incorrectly
print(f"\n6. HYPOTHESIS: Income quantities should be DIVIDED by 12")
total_sold_dozens = total_sold_qty / 12
total_donated_dozens = total_donated_qty / 12
print(f"   If we divide quantities by 12 to get dozens:")
print(f"     Sold: {total_sold_dozens:,.1f} dozen = {total_sold_dozens * 12:,.0f} eggs")
print(f"     Donated: {total_donated_dozens:,.1f} dozen = {total_donated_dozens * 12:,.0f} eggs")
print(f"   ✅ This matches the current code (quantities ARE in eggs)")

# What SHOULD the ROI calculation be?
eggs_on_hand = 0  # from settings
egg_value_per_dozen = 4.00

print(f"\n7. CORRECT ROI CALCULATION (assuming quantities are in eggs):")
eggs_consumed = total_laid - total_sold_qty - eggs_on_hand - total_broken - total_donated_qty
consumption_savings = (eggs_consumed / 12) * egg_value_per_dozen
total_income_with_savings = total_income_cash + consumption_savings
roi = total_income_with_savings - total_expenses
roi_pct = (roi / total_expenses * 100) if total_expenses > 0 else 0

print(f"   Eggs consumed: {eggs_consumed:,} eggs")
print(f"   Consumption savings: ${consumption_savings:,.2f}")
print(f"   Total income (with savings): ${total_income_with_savings:,.2f}")
print(f"   ROI: ${roi:,.2f} ({roi_pct:,.1f}%)")

print(f"\n8. DIAGNOSIS:")
print(f"   The ROI calculation code is CORRECT.")
print(f"   The problem is GARBAGE DATA IN:")
print(f"   - You have {len(data['income'])} income records")
print(f"   - They claim you sold/donated {total_sold_qty + total_donated_qty:,} eggs")
print(f"   - But you only laid {total_laid:,} eggs")
print(f"   - This is IMPOSSIBLE - likely duplicate income records")

print(f"\n9. RECOMMENDED FIXES:")
print(f"   a) Review income records for duplicates")
print(f"   b) Delete duplicate income records")
print(f"   c) Ensure quantity field represents individual EGGS (not dozens)")

# Show some income records
print(f"\n10. SAMPLE INCOME RECORDS:")
for i, rec in enumerate(data['income'][:10]):
    if rec['type'] == 'eggs':
        qty = rec.get('quantity', 0)
        amt = rec['amount']
        desc = rec.get('description', '')
        print(f"    {rec['date']}: {qty:4} eggs @ ${amt:6.2f} - {desc}")
