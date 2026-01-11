import React from "react";

interface CounterProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    label?: string;
}

export default function Counter({
    value,
    onChange,
    min = 0,
    max = 9999,
    label,
}: CounterProps) {
    const handleDecrement = () => {
        if (value > min) onChange(value - 1);
    };

    const handleIncrement = () => {
        if (value < max) onChange(value + 1);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            {label && (
                <label className="mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                </label>
            )}
            <div className="flex items-center gap-6">
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={value <= min}
                    className={`
            w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all
            ${value <= min
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : "bg-white border border-gray-200 text-gray-600 hover:border-[#1e3a1e] hover:text-[#1e3a1e] shadow-sm active:scale-90"
                        }
          `}
                >
                    −
                </button>

                <div className="w-24 text-center">
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) onChange(val);
                            else onChange(0);
                        }}
                        className="w-full text-center text-3xl font-extrabold text-gray-900 bg-transparent outline-none p-0 border-b border-transparent focus:border-green-800 transition-colors"
                        min={min}
                    />
                </div>

                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={value >= max}
                    className={`
            w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all
            ${value >= max
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : "bg-white border border-gray-200 text-gray-600 hover:border-[#1e3a1e] hover:text-[#1e3a1e] shadow-sm active:scale-90"
                        }
          `}
                >
                    +
                </button>
            </div>
        </div>
    );
}
