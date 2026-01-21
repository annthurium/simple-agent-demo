# Unit Converter

Convert between different units of measurement for temperature, distance, weight, volume, and more.

## Usage

Call this skill to convert units:
- `/unit-converter 100 celsius to fahrenheit`
- `/unit-converter 5 miles to kilometers`
- `/unit-converter 10 pounds to kilograms`
- `/unit-converter 2 gallons to liters`

## Supported Conversions

**Temperature:**
- Celsius ↔ Fahrenheit ↔ Kelvin

**Distance:**
- Meters, Kilometers, Miles, Feet, Inches, Yards

**Weight/Mass:**
- Grams, Kilograms, Pounds, Ounces, Tons

**Volume:**
- Liters, Milliliters, Gallons, Cups, Tablespoons, Teaspoons

## Examples

```
User: /unit-converter 100 celsius to fahrenheit
Result: 100°C = 212°F
```

```
User: /unit-converter 5 miles to kilometers
Result: 5 miles = 8.05 kilometers
```

## Instructions

When this skill is invoked:

1. Parse the arguments to extract:
   - Value (the number to convert)
   - From unit (source unit)
   - To unit (target unit)

2. Identify the category (temperature, distance, weight, volume)

3. Perform the conversion using the appropriate formula:

   **Temperature:**
   - C to F: (C × 9/5) + 32
   - F to C: (F - 32) × 5/9
   - C to K: C + 273.15
   - K to C: K - 273.15

   **Distance:**
   - 1 mile = 1.60934 km
   - 1 foot = 0.3048 m
   - 1 inch = 2.54 cm

   **Weight:**
   - 1 pound = 0.453592 kg
   - 1 ounce = 28.3495 g

   **Volume:**
   - 1 gallon = 3.78541 liters
   - 1 cup = 236.588 ml

4. Format the result clearly with appropriate units and precision (2-3 decimal places)

5. If the unit is not supported, list the available units for that category
