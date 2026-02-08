// fullstack-irrigation/dashboard-irrigacao/src/components/Gauge.tsx
import React from 'react';

interface GaugeProps {
    value: number; // 0-100
    size?: number;
    strokeWidth?: number;
}

export const Gauge: React.FC<GaugeProps> = ({
                                                value,
                                                size = 200,
                                                strokeWidth = 20
                                            }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    // Determina a cor baseada no valor
    const getColor = (val: number): string => {
        if (val >= 60) return '#22c55e'; // Verde
        if (val >= 40) return '#f59e0b'; // Amarelo
        return '#ef4444'; // Vermelho
    };

    const color = getColor(value);

    return (
        <div className="flex flex-col items-center justify-center">
            <svg width={size} height={size / 2 + strokeWidth / 2} className="overflow-visible">
                {/* Fundo (arco cinza) */}
                <path
                    d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Valor (arco colorido) */}
                <path
                    d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500"
                />
                {/* Texto do valor */}
                <text
                    x={size / 2}
                    y={size / 2 + 10}
                    textAnchor="middle"
                    className="text-3xl font-bold fill-slate-900"
                    style={{ fontSize: '2.5rem' }}
                >
                    {Math.round(value)}%
                </text>
            </svg>
        </div>
    );
};