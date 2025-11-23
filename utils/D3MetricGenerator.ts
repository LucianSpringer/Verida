import * as d3 from 'd3';
import { CareProtocolMatrix } from '../types';

export const generateBioclimaticHexagon = (data: CareProtocolMatrix, size: number) => {
    const radius = size / 2;

    // Normalize values to 0-100 scale
    const metrics = [
        { axis: "Water", value: Math.min(100, (168 / data.hydrationFrequencyHours) * 100) }, // Frequent water = high value
        { axis: "Humidity", value: data.atmosphericHumidityPercent },
        { axis: "Heat", value: Math.min(100, data.temperatureRangeCelsius.max * 2) },
        { axis: "Soil pH", value: (data.soilPhBalanceIdeal / 14) * 100 },
        { axis: "Light", value: data.photonicFluxRequirements === 'DIRECT' ? 100 : data.photonicFluxRequirements === 'HIGH' ? 75 : 50 },
    ];

    const angleSlice = (Math.PI * 2) / metrics.length;

    // Generate path
    const rScale = d3.scaleLinear().range([0, radius - 10]).domain([0, 100]);

    const line = d3.lineRadial<any>()
        .angle((d, i) => i * angleSlice)
        .radius(d => rScale(d.value))
        .curve(d3.curveLinearClosed);

    const pathD = line(metrics) || '';

    const gridLevels = [20, 40, 60, 80, 100];
    const gridRadii = gridLevels.map(level => rScale(level));

    const axes = metrics.map((metric, i) => {
        const x = rScale(100) * Math.sin(i * angleSlice);
        const y = -rScale(100) * Math.cos(i * angleSlice);
        return {
            x,
            y,
            label: metric.axis,
            xText: x * 1.15,
            yText: y * 1.15
        };
    });

    return {
        pathD,
        axes,
        gridRadii,
        radius
    };
};
