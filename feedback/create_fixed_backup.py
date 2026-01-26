import json

# Read the original backup
with open(r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25.json', 'r') as f:
    backup = json.load(f)

print("="*80)
print("CREATING CORRECTED BACKUP")
print("="*80)
print("\nThe app expects quantity in EGGS, but your import has inflated values.")
print("Dividing all egg income quantities by 12 to fix...")

# Fix income quantities
fixed_count = 0
for rec in backup['data']['income']:
    if rec.get('type') == 'eggs' and 'quantity' in rec and rec['quantity']:
        old_qty = rec['quantity']
        new_qty = old_qty // 12  # Divide by 12
        rec['quantity'] = new_qty
        fixed_count += 1
        if fixed_count <= 5:
            print(f"  {rec['date']}: {old_qty} → {new_qty} eggs, ${rec['amount']}")

print(f"\nFixed {fixed_count} income records")

# Verify
total_sold = sum(r.get('quantity', 0) for r in backup['data']['income'] if r.get('type') == 'eggs' and r.get('amount', 0) > 0)
total_donated = sum(r.get('quantity', 0) for r in backup['data']['income'] if r.get('type') == 'eggs' and r.get('amount', 0) == 0)
total_laid = sum(r.get('laid', r.get('count', 0)) for r in backup['data']['eggProduction'])

print(f"\nAfter correction:")
print(f"  Total eggs laid: {total_laid:,}")
print(f"  Total eggs sold: {total_sold:,}")
print(f"  Total eggs donated: {total_donated:,}")
print(f"  Total sold+donated: {total_sold + total_donated:,}")
print(f"  Remaining (consumed): {total_laid - total_sold - total_donated:,}")

if total_sold + total_donated <= total_laid:
    print(f"\n✅ FIXED! The numbers now make sense.")
    pct = ((total_sold + total_donated) / total_laid * 100) if total_laid > 0 else 0
    print(f"   You sold/donated {pct:.1f}% of your eggs")
else:
    print(f"\n⚠️  Still over by {(total_sold + total_donated) - total_laid:,} eggs")

# Save
output_file = r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25-CORRECTED.json'
with open(output_file, 'w') as f:
    json.dump(backup, f, indent=2)

print(f"\n💾 Saved to: livestock-backup-2026-01-25-CORRECTED.json")
print("\nIMPORT THIS FILE to fix your ROI calculation!")
