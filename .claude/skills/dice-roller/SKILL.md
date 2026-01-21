# Dice Roller

Roll virtual dice in various combinations, perfect for tabletop gaming, random number generation, or making decisions.

## Usage

Call this skill to roll dice:
- `/dice-roller 1d20` - Roll one 20-sided die
- `/dice-roller 3d6` - Roll three 6-sided dice
- `/dice-roller 2d10+5` - Roll two 10-sided dice and add 5
- `/dice-roller 4d8-2` - Roll four 8-sided dice and subtract 2

## Examples

```
User: /dice-roller 1d20
Result: 🎲 Rolling 1d20: [17] = 17
```

```
User: /dice-roller 3d6+4
Result: 🎲 Rolling 3d6+4: [4, 2, 5] + 4 = 15
```

## Instructions

When this skill is invoked:

1. Parse the dice notation (e.g., "2d6+3"):
   - Number of dice (before 'd')
   - Die size (after 'd', before '+' or '-')
   - Modifier (optional, after '+' or '-')

2. Validate the input:
   - Number of dice should be 1-100
   - Die size should be reasonable (d2, d4, d6, d8, d10, d12, d20, d100)
   - If invalid, explain the correct format

3. Roll the dice:
   - Generate random numbers for each die
   - Show individual rolls in brackets
   - Apply any modifiers
   - Calculate and show the total

4. Format the output clearly:
   - Show the dice notation
   - Display individual die results
   - Show the modifier if present
   - Present the final total

5. Add a dice emoji 🎲 to make it fun!
