import React, { useMemo } from 'react';
import { CareProtocolMatrix } from '../types';
import { generateBioclimaticHexagon } from '../utils/D3MetricGenerator';

interface MetricHexagonProps {
  data: CareProtocolMatrix;
  className?: string;
}

export const MetricHexagon: React.FC<MetricHexagonProps> = ({ data, className }) => {
  const size = 200;

  const { pathD, axes, gridRadii, radius } = useMemo(() => {
    return generateBioclimaticHexagon(data, size);
  }, [data, size]);

  return (
    <div className={`relative flex justify-center items-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <g transform={`translate(${radius},${radius})`}>
          {/* Grid Lines */}
          {gridRadii.map((r, i) => (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke="#10b981"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          ))}

          {/* Axes */}
          {axes.map((axis, i) => (
            <g key={i}>
              <line x1={0} y1={0} x2={axis.x} y2={axis.y} stroke="#059669" strokeOpacity={0.2} />
              <text
                x={axis.xText}
                y={axis.yText}
                textAnchor="middle"
                dy="0.35em"
                className="text-[10px] fill-emerald-800 font-bold uppercase tracking-wider"
              >
                {axis.label}
              </text>
            </g>
          ))}

          {/* Data Path */}
          <path
            d={pathD}
            fill="rgba(16, 185, 129, 0.2)"
            stroke="#10b981"
            strokeWidth={2}
          />
        </g>
      </svg>
    </div>
  );
};
