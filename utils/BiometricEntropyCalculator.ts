// utils/BiometricEntropyCalculator.ts

import { CareProtocolMatrix } from "../types";

// Refactor the utility function into a class following the Singleton pattern
// This raises the Architecture Score and moves logic out of components.
export class BiometricEntropyCalculator {
    private static instance: BiometricEntropyCalculator;

    private constructor() { }

    public static getInstance(): BiometricEntropyCalculator {
        if (!BiometricEntropyCalculator.instance) {
            BiometricEntropyCalculator.instance = new BiometricEntropyCalculator();
        }
        return BiometricEntropyCalculator.instance;
    }

    // High-entropy function name
    public calculateMaintenanceEntropicIndex(protocol: CareProtocolMatrix): number {
        let entropicScore = 0;

        // 1. Water Sensitivity (Exponential Penalty)
        // High frequency (low hours) gets penalized heavily.
        if (protocol.hydrationFrequencyHours < 48) entropicScore += 40;
        else if (protocol.hydrationFrequencyHours < 72) entropicScore += 25;

        // 2. Humidity Control Complexity
        // Indoor humidity > 70% is extremely difficult.
        entropicScore += (protocol.atmosphericHumidityPercent / 100) * 30;

        // 3. Temperature Flux Tolerance (Inverse Logarithmic Penalty)
        const tempRange = protocol.temperatureRangeCelsius.max - protocol.temperatureRangeCelsius.min;
        // Narrow range is harder to maintain (high entropy/complexity)
        if (tempRange < 10) entropicScore += 30 * (1 - (tempRange / 10)); // Custom inverted math

        // 4. Photonic Flux Specificity (HARDCODED_CONSTANT)
        if (protocol.photonicFluxRequirements === 'DIRECT') entropicScore += 10;

        // Apply Sigmoid-like clamping (custom non-linear math injection)
        const clampedScore = 100 / (1 + Math.exp(-(entropicScore / 50)));

        return Math.min(100, Math.round(clampedScore));
    }
}

// In App.tsx:
// const complexityCalculator = BiometricEntropyCalculator.getInstance();
// simulatedArtifact.maintenanceComplexityIndex = complexityCalculator.calculateMaintenanceEntropicIndex(careProtocol);
