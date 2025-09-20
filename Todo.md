# Calculation Fixes for dishes.html

## Issues to Fix:

1. **Unit Conversion Logic Problems** in `computeIngredientCost()` function
2. **Rounding Inconsistencies** throughout calculation functions
3. **Cost Display Logic Issues** in `updateIngredientCost()`
4. **Total Cost Calculation Problems** in `updateCostPrice()`

## Implementation Steps:

### Step 1: Fix Unit Conversion Logic

- [ ] Correct the base unit conversion calculations in `computeIngredientCost()`
- [ ] Ensure proper handling of different unit types (weight, volume, piece)
- [ ] Fix the conversion factor calculations

### Step 2: Standardize Rounding

- [ ] Use consistent rounding methods throughout all functions
- [ ] Round only at final display, not during intermediate calculations
- [ ] Ensure all monetary values are properly rounded to whole numbers

### Step 3: Fix Cost Display Logic

- [ ] Correct unit conversion when displaying ingredient costs
- [ ] Ensure proper calculation of total cost for selected quantity
- [ ] Fix the cost per unit conversion logic

### Step 4: Improve Total Cost Calculation

- [ ] Ensure all ingredient costs are properly summed
- [ ] Fix any issues with intermediate rounding
- [ ] Add proper validation for calculation results

## Files to Edit:

- `public/buy/dishes.html` (main file with calculation logic)

## Testing Notes:

- User will test manually after fixes are implemented
- Focus on unit conversions between different unit types
- Verify cost calculations with various quantities
- Test total cost calculation with multiple ingredients
