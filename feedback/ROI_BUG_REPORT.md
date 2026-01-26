# ROI Calculation Bug Report

## Issue Summary
The ROI calculation shows negative values and impossibly large negative percentages.

## Root Cause
**The ROI calculation code is CORRECT**. The problem is **invalid data** in the income records.

## The Data Problem

Based on your backup file `livestock-backup-2026-01-25.json`:

- **Total Eggs Laid:** 7,139 eggs
- **Total Eggs Sold (from income records):** 12,744 eggs  
- **Total Eggs Donated (from income records):** 11,160 eggs
- **Total Sold + Donated:** 23,904 eggs

**This is impossible** - you cannot sell/donate 23,904 eggs when you only laid 7,139 eggs!

## Financial Impact

Current (incorrect) calculation:
- Total Expenses: $4,383.00
- Total Income (cash): $516.50
- Eggs Consumed: -16,788 eggs (negative because income records exceed production!)
- Consumption Savings: -$5,596.00 (negative!)
- **ROI: -$9,462.50 (-215.9%)**

This is clearly wrong because you have negative consumption savings.

## How to Fix

### Option 1: Review and Delete Duplicate Income Records
Your income records likely contain duplicates. Review them in the app and delete any duplicates.

### Option 2: Verify Quantity Field Usage  
When adding egg income:
- The "Quantity" field should represent **individual eggs** (not dozens)
- For example, if you sold 12 dozen eggs, enter **144** in the quantity field (12 × 12)
- Looking at your data, this seems correct (quantities are 144, 288, 432, etc.)

### Option 3: Check for Data Migration Issues
If you imported/migrated data from another source, you may have accidentally duplicated income records.

## Code Changes Made

I've added data validation warnings to both the home dashboard and analytics screens:

1. **Data Validation:** The app now detects when income records show more eggs sold/donated than eggs laid
2. **Warning Display:** A yellow warning banner will appear when this data issue is detected
3. **No Breaking Changes:** The calculation logic remains unchanged and correct

## What the ROI Calculation Does (Correctly)

```
eggsConsumed = totalLaid - totalSold - eggsOnHand - totalBroken - totalDonated
consumptionSavings = (eggsConsumed / 12) × eggValuePerDozen
totalIncomeWithSavings = totalIncome (cash) + consumptionSavings
ROI = totalIncomeWithSavings - totalExpenses
ROI% = (ROI / totalExpenses) × 100
```

This formula is correct and accounts for:
- Cash income from sales
- Savings from eggs you consumed (instead of buying at store)
- Total expenses

## Next Steps

1. Review your income records in the "Records" tab
2. Delete any duplicate entries
3. Verify that the quantity field contains eggs (not dozens)
4. Once fixed, your ROI should show realistic positive values

The warning banner I added will disappear once your data is corrected.
