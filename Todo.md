# Ingredient Mapping Improvement Plan

## Overview

Improve ingredient mapping with better unit/piece management, default to gram (g) instead of kg, and ensure calculations handle unit conversions properly.

## Tasks

- [ ] Update default unit in ingredient modal from kg to g
- [ ] Add unit conversion utility functions for consistent calculations
- [ ] Update addIngredient function to handle unit conversions
- [ ] Update updateCostPrice function to use normalized quantities
- [ ] Update ingredient select dropdown to display units properly
- [ ] Update ingredient rendering in dishes to show correct units
- [ ] Test adding ingredients with different units and verify cost calculations

## Files to Edit

- public/buy/dishes.html (main UI and logic)
- public/buy/menu.json (update existing ingredient units if needed)

## Followup Steps

- Test the updated ingredient mapping functionality
- Verify cost calculations with different units
- Ensure UI displays units correctly
