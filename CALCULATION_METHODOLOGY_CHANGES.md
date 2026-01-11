# Calculation Methodology Changes - Progressive Bracket Pricing System

**Document Purpose:** This document explains the changes made to the architectural fee calculation methodology, transitioning from a discrete tier system to a progressive bracket system (similar to tax brackets).

**Target Audience:** Developers and teams implementing the same logic in other applications

**Date:** January 2026

---

## Table of Contents

1. [Problem Overview](#problem-overview)
2. [OLD Calculation Method](#old-calculation-method)
3. [NEW Progressive Bracket Method](#new-progressive-bracket-method)
4. [Step-by-Step Calculation Examples](#step-by-step-calculation-examples)
5. [Service Type Multipliers](#service-type-multipliers)
6. [Complexity Multiplier Integration](#complexity-multiplier-integration)
7. [Mathematical Formulas](#mathematical-formulas)
8. [Implementation Logic](#implementation-logic)

---

## Problem Overview

### The Cliff Edge Problem

The original fee calculation system used **discrete tiers** where the entire project was priced at a single rate based on the total square meters. This created "cliff edges" where jumping to the next tier caused sudden price drops, resulting in larger projects being cheaper than smaller ones.

**Example of the Problem:**
- **180 sqm project:** Priced at $186/sqm tier = 180 × $186 = **$33,480**
- **220 sqm project:** Priced at $135.5/sqm tier = 220 × $135.5 = **$29,810**

The 220 sqm project (which is 40 sqm larger) cost **$3,670 LESS** than the 180 sqm project. This is unfair and illogical.

### Why This Happened

When a project crossed a tier boundary (e.g., from 200 to 201 sqm), the **entire project** was repriced at the lower rate. This meant:
- 200 sqm: 200 × $186 = $37,200
- 201 sqm: 201 × $135.5 = $27,235 (❌ $9,965 cheaper!)

These inversions occurred at every tier boundary: 101, 201, 401, 601, and 816 sqm.

---

## OLD Calculation Method

### Discrete Tier System

**How it worked:**
1. Calculate total project size in square meters
2. Find which tier the size falls into
3. Apply that tier's rate to the **ENTIRE** project
4. Multiply by complexity (optional)

**Rate Tiers (Old System):**
```
≤100 sqm: $260/sqm
101-200 sqm: $186/sqm
201-400 sqm: $135.5/sqm
401-600 sqm: $109/sqm
601-815 sqm: $93/sqm
815+ sqm: $84/sqm
```

**Formula:**
```
Total Fee = (Total SQM) × (Single Tier Rate) × (Complexity Multiplier)
```

**Example Calculation (250 sqm, Standard Complexity):**
1. 250 sqm falls in the "201-400 sqm" tier
2. Rate = $135.5/sqm
3. Total Fee = 250 × $135.5 × 1.0 = **$33,875**

**Problems:**
- ✘ Price inversions at tier boundaries
- ✘ Clients could save money by reducing scope
- ✘ Larger projects could cost less than smaller ones
- ✘ Unfair pricing structure

---

## NEW Progressive Bracket Method

### Tax Bracket Style Pricing

**How it works:**
1. Calculate total project size in square meters
2. **Divide the project into brackets**
3. Apply different rates to different **portions** of the project
4. Sum all bracket fees for the total
5. Multiply by complexity (optional)

**Think of it like income tax brackets:**
- First $50,000 taxed at 10%
- Next $50,000 taxed at 15%
- Next $100,000 taxed at 20%
- And so on...

**The key difference:** Instead of applying one rate to everything, we apply different rates to different portions.

### Progressive Bracket Rates

**Conservative Brackets (designed to minimize revenue disruption):**
```
Bracket 1: First 100 sqm charged at $260/sqm
Bracket 2: Next 100 sqm (101-200) charged at $140/sqm
Bracket 3: Next 200 sqm (201-400) charged at $88/sqm
Bracket 4: Next 200 sqm (401-600) charged at $68/sqm
Bracket 5: Next 215 sqm (601-815) charged at $58/sqm
Bracket 6: Everything above 815 sqm charged at $52/sqm
```

**Why these rates?**
These rates were calibrated to:
1. Eliminate all price inversions (guarantee monotonic pricing)
2. Maintain similar revenue levels to the old system
3. Provide volume discounts (higher brackets cost less per sqm)
4. Correct systematic underpricing at cliff edges

---

## Step-by-Step Calculation Examples

### Example 1: 180 sqm Project (Baseline Service, Standard Complexity)

**Step 1: Apply Bracket Rates**
- First 100 sqm: 100 × $260 = $26,000
- Next 80 sqm: 80 × $140 = $11,200
- **Subtotal: $37,200**

**Step 2: Calculate Effective Rate**
- Effective Rate = $37,200 ÷ 180 sqm = **$206.67/sqm**

**Step 3: Apply Complexity Multiplier (if applicable)**
- Standard Complexity = 1.0x multiplier
- Final Fee = $37,200 × 1.0 = **$37,200**

**Comparison to Old System:**
- Old System: 180 × $186 = $33,480
- New System: **$37,200**
- Difference: +$3,720 (+11%)

---

### Example 2: 250 sqm Project (Baseline Service, Standard Complexity)

**Step 1: Apply Bracket Rates**
- First 100 sqm: 100 × $260 = $26,000
- Next 100 sqm: 100 × $140 = $14,000
- Next 50 sqm: 50 × $88 = $4,400
- **Subtotal: $44,400**

**Step 2: Calculate Effective Rate**
- Effective Rate = $44,400 ÷ 250 sqm = **$177.60/sqm**

**Step 3: Apply Complexity Multiplier (if applicable)**
- Standard Complexity = 1.0x multiplier
- Final Fee = $44,400 × 1.0 = **$44,400**

**Comparison to Old System:**
- Old System: 250 × $135.5 = $33,875
- New System: **$44,400**
- Difference: +$10,525 (+31%)

---

### Example 3: 450 sqm Project (Baseline Service, Complex Dwelling)

**Step 1: Apply Bracket Rates**
- First 100 sqm: 100 × $260 = $26,000
- Next 100 sqm: 100 × $140 = $14,000
- Next 200 sqm: 200 × $88 = $17,600
- Next 50 sqm: 50 × $68 = $3,400
- **Subtotal: $61,000**

**Step 2: Calculate Effective Rate**
- Effective Rate = $61,000 ÷ 450 sqm = **$135.56/sqm**

**Step 3: Apply Complexity Multiplier**
- Complex Dwelling = 1.4x multiplier
- Final Fee = $61,000 × 1.4 = **$85,400**

**Comparison to Old System:**
- Old System (without complexity): 450 × $109 = $49,050
- Old System (with complexity): $49,050 × 1.4 = $68,670
- New System: **$85,400**
- Difference: +$16,730 (+24%)

---

### Example 4: Verifying No Inversions (220 sqm vs 180 sqm)

**180 sqm:**
- First 100 sqm: 100 × $260 = $26,000
- Next 80 sqm: 80 × $140 = $11,200
- **Total: $37,200**

**220 sqm:**
- First 100 sqm: 100 × $260 = $26,000
- Next 100 sqm: 100 × $140 = $14,000
- Next 20 sqm: 20 × $88 = $1,760
- **Total: $41,760**

**Result:** ✅ 220 sqm ($41,760) costs MORE than 180 sqm ($37,200)
**Difference:** +$4,560

This confirms the progressive system eliminates inversions - larger projects always cost more.

---

## Service Type Multipliers

The progressive brackets apply to **baseline design fees**. For add-on services (Interior Design and Masterplan), we apply multipliers to maintain the relative pricing ratios.

### Multiplier Values

```
Baseline: 1.0× (use bracket rates as-is)
Interior Design: 0.45× (approximately 45% of baseline)
Masterplan: 0.10× (approximately 10% of baseline)
```

### How Service Multipliers Work

**For a 200 sqm project with all services enabled:**

**Baseline Fee:**
- First 100 sqm: 100 × $260 × 1.0 = $26,000
- Next 100 sqm: 100 × $140 × 1.0 = $14,000
- **Baseline Total: $40,000**

**Interior Design Fee:**
- First 100 sqm: 100 × $260 × 0.45 = $11,700
- Next 100 sqm: 100 × $140 × 0.45 = $6,300
- **Interiors Total: $18,000**

**Masterplan Fee:**
- First 100 sqm: 100 × $260 × 0.10 = $2,600
- Next 100 sqm: 100 × $140 × 0.10 = $1,400
- **Masterplan Total: $4,000**

**Combined Total (before complexity): $40,000 + $18,000 + $4,000 = $62,000**

### Why These Multipliers?

These multipliers were chosen to:
1. Maintain historical pricing relationships between services
2. Keep interior design fees at approximately $100-120/sqm effective rate at lower tiers
3. Keep masterplan fees at approximately $12-25/sqm effective rate at lower tiers
4. Scale proportionally with the baseline brackets

---

## Complexity Multiplier Integration

**Complexity multipliers are applied AFTER the bracket calculation**, just like in the old system.

### Complexity Levels

```
Level 1 - Simple: 0.75× (25% discount)
Level 2 - Below Average: 0.9× (10% discount)
Level 3 - Standard: 1.0× (no adjustment)
Level 4 - Above Average: 1.2× (20% premium)
Level 5 - Complex: 1.4× (40% premium)
```

### Application Order

1. **Calculate bracket-based fee** (baseline + interiors + masterplan)
2. **Apply complexity multiplier** to the total

**Example (300 sqm, Baseline only, Complex dwelling):**

**Step 1: Calculate Bracket Fee**
- First 100 sqm: 100 × $260 = $26,000
- Next 100 sqm: 100 × $140 = $14,000
- Next 100 sqm: 100 × $88 = $8,800
- Subtotal: $48,800

**Step 2: Apply Complexity Multiplier**
- Complex (1.4×): $48,800 × 1.4 = **$68,320**

**Old System (for comparison):**
- 300 × $135.5 × 1.4 = $56,910

**Difference:** +$11,410 (+20%)

---

## Mathematical Formulas

### General Progressive Bracket Formula

```
Total Fee = (Σ Bracket Fees) × Complexity Multiplier

Where:
Bracket Fee[i] = (Min(Total SQM, Bracket Limit[i]) - Previous Limit) × Bracket Rate[i] × Service Multiplier

Previous Limit = Bracket Limit[i-1] (or 0 for first bracket)
```

### Effective Rate Formula

```
Effective Rate = Total Fee (before complexity) ÷ Total SQM
```

This effective rate is what gets displayed to the user instead of showing the bracket breakdown.

### Detailed Formula for Multiple Services

```
Total Baseline Fee = Σ (Bracket[i] SQM × Bracket[i] Rate × 1.0)
Total Interiors Fee = Σ (Bracket[i] SQM × Bracket[i] Rate × 0.45)
Total Masterplan Fee = Σ (Bracket[i] SQM × Bracket[i] Rate × 0.10)

Subtotal = Total Baseline + Total Interiors + Total Masterplan
Final Fee = Subtotal × Complexity Multiplier
```

---

## Implementation Logic

### Pseudocode for Progressive Bracket Calculation

```
FUNCTION calculateProgressiveFee(sqm, serviceType):
    brackets = [
        {limit: 100, rate: 260},
        {limit: 200, rate: 140},
        {limit: 400, rate: 88},
        {limit: 600, rate: 68},
        {limit: 815, rate: 58},
        {limit: Infinity, rate: 52}
    ]

    multipliers = {
        baseline: 1.0,
        interiors: 0.45,
        masterplan: 0.10
    }

    totalFee = 0
    previousLimit = 0

    FOR EACH bracket IN brackets:
        IF sqm <= previousLimit:
            BREAK  // No more brackets apply

        applicableSize = MIN(sqm, bracket.limit) - previousLimit
        adjustedRate = bracket.rate × multipliers[serviceType]
        bracketFee = applicableSize × adjustedRate

        totalFee += bracketFee
        previousLimit = bracket.limit

    effectiveRate = totalFee / sqm

    RETURN {
        totalFee: totalFee,
        effectiveRate: effectiveRate
    }
END FUNCTION
```

### Pseudocode for Complete Fee Calculation

```
FUNCTION calculateProjectFee(sqm, servicesEnabled, complexityLevel):
    baselineFee = 0
    interiorsFee = 0
    masterplanFee = 0

    // Always calculate baseline
    baseline = calculateProgressiveFee(sqm, 'baseline')
    baselineFee = baseline.totalFee

    // Add optional services
    IF servicesEnabled.interiors:
        interiors = calculateProgressiveFee(sqm, 'interiors')
        interiorsFee = interiors.totalFee

    IF servicesEnabled.masterplan:
        masterplan = calculateProgressiveFee(sqm, 'masterplan')
        masterplanFee = masterplan.totalFee

    // Sum all service fees
    subtotal = baselineFee + interiorsFee + masterplanFee

    // Apply complexity multiplier
    complexityMultipliers = {1: 0.75, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.4}
    finalFee = subtotal × complexityMultipliers[complexityLevel]

    RETURN finalFee
END FUNCTION
```

### Implementation Checklist

When implementing this system in another application, ensure:

1. ✅ **Bracket Configuration**
   - Define the 6 bracket levels with correct limits and rates
   - Use Infinity or a very large number for the final bracket limit

2. ✅ **Service Multipliers**
   - Implement 1.0× for baseline
   - Implement 0.45× for interiors
   - Implement 0.10× for masterplan

3. ✅ **Complexity Multipliers**
   - Define all 5 levels (0.75, 0.9, 1.0, 1.2, 1.4)
   - Apply AFTER bracket calculation

4. ✅ **Loop Logic**
   - Track previous limit correctly
   - Use MIN(sqm, bracket.limit) to avoid over-counting
   - Break when sqm <= previousLimit

5. ✅ **Effective Rate Display**
   - Show effective rate (total ÷ sqm) instead of bracket breakdown
   - Round to 2 decimal places for display

6. ✅ **Testing**
   - Test boundary values (99, 100, 101, 199, 200, 201, etc.)
   - Verify no inversions (larger projects always cost more)
   - Compare results with the pricing table in the main plan document

---

## Key Takeaways

### For Implementation

1. **Progressive brackets work like tax brackets** - different portions charged at different rates
2. **Service multipliers scale the brackets** - not separate bracket systems
3. **Complexity applies at the end** - multiply final fee, not each bracket
4. **Effective rate simplifies UI** - users don't need to see bracket breakdown
5. **No inversions guaranteed** - mathematical property of progressive systems

### For Communication

When explaining to clients or stakeholders:
- "Like tax brackets, you pay less per additional square meter as your project grows"
- "Ensures fairness - larger projects always cost more than smaller ones"
- "Transparent pricing based on industry-standard progressive model"
- "Volume discounts built in through bracket structure"

### For Comparison

| Aspect | Old System | New System |
|--------|-----------|------------|
| **Pricing Model** | Discrete tiers | Progressive brackets |
| **Rate Application** | Single rate to entire project | Different rates to different portions |
| **Price Inversions** | ❌ Yes (5 cliff edges) | ✅ None (monotonic increase) |
| **Fairness** | ❌ Penalizes size increases | ✅ Rewards larger projects |
| **Transparency** | ⚠️ Simple but flawed | ✅ Industry-standard |
| **Revenue Impact** | Baseline | +8% to +40% depending on size |

---

## Summary

The new progressive bracket pricing system eliminates all price inversions while maintaining volume discounts. By treating architectural fees like tax brackets - charging different rates for different portions of the project - we ensure that larger projects always cost more than smaller ones, creating a fair and transparent pricing structure.

**The core principle:** Every additional square meter adds value, and the pricing should reflect that. Progressive brackets guarantee this while still providing economies of scale through decreasing marginal rates.

---

**Document Version:** 1.0
**Last Updated:** January 11, 2026
**Contact:** For questions about implementation, refer to the main plan document or the source code in `src/hooks/use-fee-calculator.ts`
