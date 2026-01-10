import { ScalingTier, DEFAULT_SCALING_TIERS } from "@/types/calculator";

/**
 * Calculates the scaling multiplier for a given area based on defined tiers.
 * Uses linear interpolation between tiers.
 * 
 * @param area Project area in square meters
 * @param tiersDefined Configuration tiers (defaults to DEFAULT_SCALING_TIERS if empty/undefined)
 * @returns Calculated multiplier
 */
export const getScalingMultiplier = (area: number, tiersDefined?: ScalingTier[]): number => {
    // Ensure we have valid tiers
    const tiers = (tiersDefined && tiersDefined.length > 0) 
        ? [...tiersDefined] 
        : [...DEFAULT_SCALING_TIERS];
    
    // Sort tiers by limit just in case
    tiers.sort((a, b) => a.limit - b.limit);

    // If area is smaller than or equal to the smallest tier, use that tier's multiplier
    // (Usually the smallest tier is 0 or 100, if it's 100 and we have 50, we just use 100's val)
    if (area <= tiers[0].limit) {
        return tiers[0].multiplier;
    }

    // If area is larger than or equal to the largest tier, use the largest tier's multiplier
    // (We clamp at the top end)
    if (area >= tiers[tiers.length - 1].limit) {
        return tiers[tiers.length - 1].multiplier;
    }

    // Find the two tiers bounding the current area
    for (let i = 0; i < tiers.length - 1; i++) {
        const lower = tiers[i];
        const upper = tiers[i + 1];

        if (area <= upper.limit) {
            // Linear Interpolation
            // formula: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
            const range = upper.limit - lower.limit;
            
            // Prevent division by zero
            if (range === 0) return lower.multiplier;

            const progress = area - lower.limit;
            const percentage = progress / range;
            
            const multiplierRange = upper.multiplier - lower.multiplier;
            return lower.multiplier + (percentage * multiplierRange);
        }
    }

    // Fallback (should be covered by above cases)
    return 1.0;
};
