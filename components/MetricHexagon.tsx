import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { CareProtocolMatrix } from '../types';

interface MetricHexagonProps {
  data: CareProtocolMatrix;
  className?: string;
}

export const MetricHexagon: React.FC<MetricHexagonProps> = ({ data, className }) => {
  const metrics = useMemo(() => {
    // Normalize values to 0-100 scale
    return [
      { axis: "Water", value: Math.min(100, (168 / data.hydrationFrequencyHours) * 100) }, // Frequent water = high value
      { axis: "Humidity", value: data.atmosphericHumidityPercent },
      { axis: "Heat", value: Math.min(100, data.temperatureRangeCelsius.max * 2) },
      { axis: "Soil pH", value: (data.soilPhBalanceIdeal / 14) * 100 },
      { axis: "Light", value: data.photonicFluxRequirements === 'DIRECT' ? 100 : data.photonicFluxRequirements === 'HIGH' ? 75 : 50 },
    ];
  }, [data]);

  const size = 200;
  const radius = size / 2;
  const angleSlice = (Math.PI * 2) / metrics.length;

  // Generate path
  const rScale = d3.scaleLinear().range([0, radius - 10]).domain([0, 100]);
  
  const line = d3.lineRadial<any>()
    .angle((d, i) => i * angleSlice)
    .radius(d => rScale(d.value))
    .curve(d3.curveLinearClosed);

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className={`relative flex justify-center items-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <g transform={`translate(${radius},${radius})`}>
          {/* Grid Lines */}
          {gridLevels.map((level, i) => (
            <circle
              key={i}
              r={rScale(level)}
              fill="none"
              stroke="#10b981"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          ))}

          {/* Axes */}
          {metrics.map((metric, i) => {
            const x = rScale(100) * Math.sin(i * angleSlice);
            const y = -rScale(100) * Math.cos(i * angleSlice);
            return (
              <g key={i}>
                <line x1={0} y1={0} x2={x} y2={y} stroke="#059669" strokeOpacity={0.2} />
                <text
                  x={x * 1.15}
                  y={y * 1.15}
                  textAnchor="middle"
                  dy="0.35em"
                  className="text-[10px] fill-emerald-800 font-bold uppercase tracking-wider"
                >
                  {metric.axis}
                </text>
              </g>
            );
          })}

          {/* Data Path */}
          <path
            d={line(metrics) || ''}
            fill="rgba(16, 185, 129, 0.2)"
            stroke="#10b981"
            strokeWidth={2}
          />
        </g>
      </svg>
    </div>
  );
};
