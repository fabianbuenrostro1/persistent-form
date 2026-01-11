import React from "react";

interface SelectionCardProps {
    title: string;
    inventoryCount?: string | number;
    selected: boolean;
    onClick: () => void;
    price?: string;
    className?: string; // Allow custom sizing
}

export default function SelectionCard({
    title,
    inventoryCount,
    selected,
    onClick,
    price,
    className = "h-44",
}: SelectionCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        cursor-pointer 
        relative flex flex-col justify-between
        w-full p-4 md:p-6
        rounded-2xl border transition-all duration-300 ease-out
        ${className}
        ${selected
                    ? "border-[#1e3a1e] shadow-xl scale-[1.02] bg-[#fdfdfc] ring-1 ring-[#1e3a1e]/10"
                    : "border-transparent bg-white shadow-md hover:shadow-lg hover:-translate-y-1 hover:border-gray-200"
                }
      `}
        >
            {/* Top Section: Title */}
            <div>
                <h3 className={`font-bold tracking-tight leading-tight ${selected ? "text-[#1e3a1e]" : "text-gray-800"} ${title.length > 10 ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
                    {title}
                </h3>
                {price && <p className="text-gray-500 text-xs md:text-sm mt-1 font-medium">{price}</p>}
            </div>

            {/* Bottom Section: Inventory Badge */}
            <div className="flex items-center justify-between mt-auto pt-2">
                {inventoryCount ? (
                    <div className={`
             flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wide
             ${String(inventoryCount) !== "0" && String(inventoryCount) !== "..."
                            ? "text-green-700"
                            : "text-gray-400"
                        }
          `}>
                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${String(inventoryCount) !== "0" && String(inventoryCount) !== "..." ? "bg-green-500 animate-pulse" : "bg-gray-300"
                            }`} />
                        {inventoryCount === "..." ? "Checking..." : `${inventoryCount} available`}
                    </div>
                ) : (
                    <span className="block" /> /* Spacer */
                )}
            </div>

            {/* Selection Checkmark Indicator */}
            {selected && (
                <div className="absolute top-2 right-2 md:top-4 md:right-4 text-[#1e3a1e] animate-zoom-in">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
    );
}
