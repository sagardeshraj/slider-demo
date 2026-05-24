'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

const Slider = ({ label, value, onChange, color, index }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
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
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
          }}
        />
        <style jsx>{`
          input[type='range'] {
            -webkit-appearance: none;
          }
          input[type='range']:focus {
            outline: none;
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
          input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.15);
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

const ConstrainedSliders = ({
  labels = ['Comfort', 'Performance', 'Battery', 'Storage'],
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
  initialValues = [25, 25, 25, 25],
  onTotalChange,
}: {
  labels?: string[];
  colors?: string[];
  initialValues?: number[];
  onTotalChange?: (values: number[]) => void; // ← Added ? here
}) => {
  const [values, setValues] = useState(() => {
    const sum = initialValues.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.01) {
      const scale = 100 / sum;
      return initialValues.map((v) => v * scale);
    }
    return [...initialValues];
  });

  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(values);
    }
  }, [values, onTotalChange]);

  const updateValues = useCallback((changedIndex, newValue) => {
    setValues((prevValues) => {
      const oldValue = prevValues[changedIndex];
      const delta = newValue - oldValue;

      if (Math.abs(delta) < 0.01) return prevValues;

      const otherIndices = [0, 1, 2, 3].filter((i) => i !== changedIndex);

      const perOther = -delta / otherIndices.length;

      const newValues = [...prevValues];
      newValues[changedIndex] = newValue;

      otherIndices.forEach((i) => {
        newValues[i] = prevValues[i] + perOther;
      });

      let hasNegative = false;
      for (const i of otherIndices) {
        if (newValues[i] < 0) {
          hasNegative = true;
          break;
        }
      }

      if (hasNegative) {
        let deficit = 0;
        for (const i of otherIndices) {
          if (newValues[i] < 0) {
            deficit += -newValues[i];
            newValues[i] = 0;
          }
        }

        const positiveOthers = otherIndices.filter((i) => newValues[i] > 0);
        if (positiveOthers.length > 0 && deficit > 0) {
          const perPositive = deficit / positiveOthers.length;
          for (const i of positiveOthers) {
            newValues[i] = Math.max(0, newValues[i] - perPositive);
          }
        }
      }

      let sum = newValues.reduce((a, b) => a + b, 0);
      const difference = 100 - sum;

      if (Math.abs(difference) > 0.001) {
        newValues[otherIndices[0]] = parseFloat(
          (newValues[otherIndices[0]] + difference).toFixed(1)
        );

        sum = newValues.reduce((a, b) => a + b, 0);

        if (Math.abs(sum - 100) > 0.001) {
          newValues[changedIndex] = parseFloat(
            (newValues[changedIndex] + (100 - sum)).toFixed(1)
          );
        }
      }

      const roundedValues = newValues.map((v) => {
        let rounded = Math.round(v * 10) / 10;
        rounded = Math.min(100, Math.max(0, rounded));
        return rounded;
      });

      const finalSum = roundedValues.reduce((a, b) => a + b, 0);
      if (Math.abs(finalSum - 100) > 0.01) {
        roundedValues[otherIndices[otherIndices.length - 1]] = parseFloat(
          (
            roundedValues[otherIndices[otherIndices.length - 1]] +
            (100 - finalSum)
          ).toFixed(1)
        );
      }

      return roundedValues;
    });
  }, []);

  const handleSliderChange = useCallback(
    (index, newValue) => {
      updateValues(index, newValue);
    },
    [updateValues]
  );

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
      <div className="space-y-5">
        {values.map((value, index) => (
          <Slider
            key={index}
            label={labels[index]}
            value={value}
            onChange={(newVal) => handleSliderChange(index, newVal)}
            color={colors[index]}
            index={index}
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

export default ConstrainedSliders;
