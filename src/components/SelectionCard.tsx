import React from "react";

interface SelectionCardProps {
    title: string;
    inventoryCount?: string | number;
    selected: boolean;
    onClick: () => void;
    price?: string;
    className?: string; // Allow custom sizing
    imageUrl?: string; // New prop for product image
}

export default function SelectionCard({
    title,
    inventoryCount,
    selected,
    onClick,
    price,
    className = "h-44",
    imageUrl,
}: SelectionCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        cursor-pointer 
        relative flex flex-col overflow-hidden
        w-full
        rounded-2xl border transition-all duration-300 ease-out
        ${className}
        ${selected
                    ? "border-[#1e3a1e] shadow-xl scale-[1.02] bg-white ring-1 ring-[#1e3a1e]/10"
                    : "border-gray-100 bg-white shadow-md hover:shadow-lg hover:-translate-y-1 hover:border-gray-200"
                }
      `}
        >
            {/* 1. Image Section (Top 65%) */}
            {/* "Open" look: No text overlay, just the image with a subtle bottom fade if desired, but mostly clear. */}
            {imageUrl && (
                <div className="relative w-full h-[65%] overflow-hidden bg-gray-50 border-b border-gray-50">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover mix-blend-overlay opacity-90 transition-transform duration-700 hover:scale-105"
                        style={{ mixBlendMode: 'normal' }} // Reset blend mode to normal for clear photo
                    />
                    {/* Subtle gradient at the very bottom of the image to blend with white card body */}
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white/20 to-transparent"></div>
                </div>
            )}

            {/* 2. Content Section (Bottom 35%) */}
            {/* Mimic the reference: Title/Info Left, Price Bottom Right */}
            <div className="flex-1 p-4 flex flex-col justify-between">

                {/* Top of Text Area: Title & Inventory */}
                <div className="flex flex-col gap-1">
                    <h3 className={`font-bold tracking-tight text-xl md:text-2xl ${selected ? "text-[#1e3a1e]" : "text-gray-900"}`}>
                        {title}
                    </h3>

                    {/* Inventory as "Metadata/Subtitle" */}
                    <div className="flex items-center gap-2">
                        {inventoryCount ? (
                            <div className={`
                       flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide
                       ${String(inventoryCount) !== "0" && String(inventoryCount) !== "..."
                                    ? "text-gray-500" // Subtler text color per reference
                                    : "text-gray-400"
                                }
                    `}>
                                <div className={`w-1.5 h-1.5 rounded-full ${String(inventoryCount) !== "0" && String(inventoryCount) !== "..." ? "bg-green-500" : "bg-gray-300"
                                    }`} />
                                {inventoryCount === "..." ? "Checking..." : `${inventoryCount} available`}
                            </div>
                        ) : (
                            <span className="h-4" />
                        )}
                    </div>
                </div>

                {/* Bottom of Text Area: Price (Right Aligned & Big) */}
                <div className="flex items-end justify-end mt-2">
                    {price && (
                        <div className="text-right">
                            <span className={`block font-bold text-lg md:text-xl ${selected ? "text-[#1e3a1e]" : "text-gray-900"}`}>
                                {price.split('/')[0]} <span className="text-xs md:text-sm font-normal text-gray-500">/ bale</span>
                            </span>
                        </div>
                    )}
                </div>

            </div>

            {/* Selection Checkmark Indicator (Top Right Over Image) */}
            {selected && (
                <div className="absolute top-3 right-3 text-white drop-shadow-md animate-zoom-in z-20">
                    <div className="bg-[#1e3a1e] rounded-full p-1.5 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}
```
