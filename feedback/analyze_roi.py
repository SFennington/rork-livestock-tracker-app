import json

# Read the backup file
with open(r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25.json', 'r') as f:
    data = json.load(f)['data']

# Calculate total expenses
total_expenses = sum(e['amount'] for e in data['expenses'])
print(f"Total Expenses: ${total_expenses:,.2f}")

# Calculate total income (cash only)
total_income_cash = sum(i['amount'] for i in data['income'])
print(f"Total Income (cash): ${total_income_cash:,.2f}")

# Calculate eggs sold, donated, broken, laid
total_sold = 0
total_donated = 0
total_broken = 0
total_laid = 0

for record in data['income']:
    if record['type'] == 'eggs' and 'quantity' in record:
        if record['amount'] == 0:
            total_donated += record['quantity']
        else:
            total_sold += record['quantity']

for record in data['eggProduction']:
    total_laid += record.get('laid', record.get('count', 0))
    total_broken += record.get('broken', 0)

print(f"\nEgg Production:")
print(f"  Total Laid: {total_laid:,} eggs")
print(f"  Total Sold: {total_sold:,} eggs")
print(f"  Total Donated: {total_donated:,} eggs")
print(f"  Total Broken: {total_broken:,} eggs")

# Assuming eggs on hand = 0 for now (need to check app settings)
eggs_on_hand = 0  # This should come from settings
egg_value_per_dozen = 4.00  # Default value

# Calculate consumed eggs
eggs_consumed = total_laid - total_sold - eggs_on_hand - total_broken - total_donated
print(f"  Eggs Consumed: {eggs_consumed:,} eggs")

# Calculate consumption savings
consumption_savings = (eggs_consumed / 12) * egg_value_per_dozen
print(f"  Consumption Savings: ${consumption_savings:,.2f}")

# Calculate total income with savings
total_income_with_savings = total_income_cash + consumption_savings
print(f"\nTotal Income (with savings): ${total_income_with_savings:,.2f}")

# Calculate ROI
roi = total_income_with_savings - total_expenses
roi_percentage = ((total_income_with_savings - total_expenses) / total_expenses) * 100 if total_expenses > 0 else 0

print(f"\nROI: ${roi:,.2f}")
print(f"ROI Percentage: {roi_percentage:,.2f}%")

print("\n" + "="*50)
print("ISSUE FOUND:")
print(f"Total Laid: {total_laid} eggs")
print(f"Total Sold: {total_sold} eggs")
print(f"Total Donated: {total_donated} eggs")
print(f"Sum of Sold + Donated: {total_sold + total_donated} eggs")
print(f"\n⚠️ PROBLEM: Sold + Donated ({total_sold + total_donated}) > Total Laid ({total_laid})")
print("This means there are duplicate income records or incorrect quantity tracking!")
