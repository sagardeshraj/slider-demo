'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}

interface ConstrainedSlidersProps {
  labels?: string[];
  colors?: string[];
  initialValues?: number[];
  onTotalChange?: (values: number[]) => void;
}

// Slider Component
const Slider = ({ label, value, onChange, color }: SliderProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold" style={{ color }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={handleChange}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
          }}
        />
        <style jsx>{`
          input[type='range'] {
            -webkit-appearance: none;
          }
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: ${color};
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            border: 2px solid white;
          }
          input[type='range']::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: ${color};
            cursor: pointer;
            border: none;
          }
        `}</style>
      </div>
    </div>
  );
};

// Main Component
const ConstrainedSliders = ({
  labels = ['Comfort', 'Performance', 'Battery', 'Storage'],
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
  initialValues = [25, 25, 25, 25],
  onTotalChange,
}: ConstrainedSlidersProps) => {
  const [values, setValues] = useState<number[]>(() => {
    const sum = initialValues.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.01) {
      const scale = 100 / sum;
      return initialValues.map((v) => Math.round(v * scale * 10) / 10);
    }
    return [...initialValues];
  });

  useEffect(() => {
    onTotalChange?.(values);
  }, [values, onTotalChange]);

  const updateValues = useCallback((changedIndex: number, newValue: number) => {
    setValues((prev) => {
      let newValues = [...prev];
      const delta = newValue - prev[changedIndex];
      const otherIndices = [0, 1, 2, 3].filter((i) => i !== changedIndex);

      newValues[changedIndex] = newValue;

      // Distribute delta
      const perOther = -delta / otherIndices.length;
      otherIndices.forEach((i) => {
        newValues[i] += perOther;
      });

      // Prevent negative values
      let deficit = 0;
      otherIndices.forEach((i) => {
        if (newValues[i] < 0) {
          deficit += -newValues[i];
          newValues[i] = 0;
        }
      });

      if (deficit > 0) {
        const positiveOthers = otherIndices.filter((i) => newValues[i] > 0);
        if (positiveOthers.length > 0) {
          const perPositive = deficit / positiveOthers.length;
          positiveOthers.forEach((i) => {
            newValues[i] = Math.max(0, newValues[i] - perPositive);
          });
        }
      }

      // Force sum to 100
      let sum = newValues.reduce((a, b) => a + b, 0);
      let diff = 100 - sum;

      if (Math.abs(diff) > 0.001) {
        newValues[otherIndices[0]] += diff;
      }

      // Round to 1 decimal
      newValues = newValues.map((v) =>
        Math.min(100, Math.max(0, Math.round(v * 10) / 10))
      );

      // Final correction
      sum = newValues.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.01) {
        newValues[otherIndices[otherIndices.length - 1]] += 100 - sum;
      }

      return newValues;
    });
  }, []);

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
      <div className="space-y-5">
        {values.map((value, index) => (
          <Slider
            key={index}
            label={labels[index] || `Option ${index + 1}`}
            value={value}
            onChange={(newVal) => updateValues(index, newVal)}
            color={colors[index] || '#3b82f6'}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Total</span>
          <span
            className={`text-lg font-bold ${
              Math.abs(total - 100) < 0.1 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {total.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ✅ This is what Next.js expects in app/page.tsx
export default function Page() {
  return <ConstrainedSliders />;
}
