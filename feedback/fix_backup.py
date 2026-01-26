import json

# Read the original backup
with open(r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25.json', 'r') as f:
    backup = json.load(f)

# Fix income quantities - divide by 12 to convert eggs to dozens
# (The import had eggs in the quantity field, but it should be dozens)
fixed_count = 0
for rec in backup['data']['income']:
    if rec.get('type') == 'eggs' and 'quantity' in rec and rec['quantity']:
        old_qty = rec['quantity']
        rec['quantity'] = old_qty // 12  # Convert eggs to dozens (integer division)
        fixed_count += 1

print(f"Fixed {fixed_count} income records (divided quantities by 12)")

# Verify the fix
total_sold = sum(r.get('quantity', 0) for r in backup['data']['income'] if r.get('type') == 'eggs' and r.get('amount', 0) > 0)
total_donated = sum(r.get('quantity', 0) for r in backup['data']['income'] if r.get('type') == 'eggs' and r.get('amount', 0) == 0)
total_laid = sum(r.get('laid', r.get('count', 0)) for r in backup['data']['eggProduction'])

print(f"\nAfter fix:")
print(f"  Total eggs laid: {total_laid:,}")
print(f"  Total DOZENS sold: {total_sold:,}")
print(f"  Total DOZENS donated: {total_donated:,}")
print(f"  Total eggs sold (converted): {total_sold * 12:,}")
print(f"  Total eggs donated (converted): {total_donated * 12:,}")
print(f"  Total accounted for: {(total_sold + total_donated) * 12:,}")

if (total_sold + total_donated) * 12 <= total_laid:
    print(f"\n✅ FIXED! Now you've sold/donated {(total_sold + total_donated) * 12:,} eggs from {total_laid:,} laid")
else:
    print(f"\n⚠️  Still an issue - {(total_sold + total_donated) * 12:,} eggs from {total_laid:,} laid")

# Save the corrected backup
output_file = r'c:\Users\cfenn\_Git\rork-livestock-tracker-app\feedback\livestock-backup-2026-01-25-CORRECTED.json'
with open(output_file, 'w') as f:
    json.dump(backup, f, indent=2)

print(f"\n💾 Saved corrected backup to: livestock-backup-2026-01-25-CORRECTED.json")
print("\nYou can now import this corrected file!")
