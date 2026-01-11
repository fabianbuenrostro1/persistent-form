import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface AirbnbInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    registration: UseFormRegisterReturn;
    error?: string;
    helperText?: string;
}

export default function AirbnbInput({
    label,
    registration,
    error,
    helperText,
    className = "",
    ...props
}: AirbnbInputProps) {

    // Wrapper for onChange to handle simple masking if needed
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (props.type === "tel") {
            let val = e.target.value.replace(/\D/g, "");
            if (val.length > 10) val = val.slice(0, 10);

            if (val.length > 6) {
                val = `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6)}`;
            } else if (val.length > 3) {
                val = `(${val.slice(0, 3)}) ${val.slice(3)}`;
            }
            e.target.value = val;
        }
        registration.onChange(e);
    };

    return (
        <div className={`w-full relative ${className}`}>
            <div className="relative group">
                <input
                    {...registration}
                    {...props}
                    onChange={handleChange}
                    placeholder=" " // crucial for peer-placeholder-shown
                    className={`
            peer
            w-full pt-6 pb-2 px-4 text-base text-gray-900 
            bg-white border rounded-xl outline-none transition-all duration-200
            placeholder-transparent
            ${error
                            ? "border-red-500 focus:ring-2 focus:ring-red-200"
                            : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black shadow-sm hover:border-gray-300"
                        }
          `}
                />
                <label className={`
          absolute left-4 top-4 text-gray-500 text-base transition-all duration-200 origin-[0]
          peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-400
          peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:font-bold peer-focus:text-gray-700
          peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-gray-700
          pointer-events-none
        `}>
                    {label}
                </label>
            </div>
            {error && <p className="mt-1 text-sm text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500 ml-1">{helperText}</p>
            )}
        </div>
    );
}
