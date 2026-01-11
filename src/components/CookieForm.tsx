"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import SelectionCard from "./SelectionCard";
import AirbnbInput from "./AirbnbInput";
import Counter from "./Counter";

type FormData = {
  firstName: string;
  lastName: string;
  email: string; // New field
  phone: string;
  product: string;
  quantity: number; // Changed to number for Counter
  type: string;
  delivery: string;
  address?: string;
  feedback: string;
};

// Brand Colors: Green #1e3a1e, Gold #d4a34c

export default function CookieForm() {
  const [inventoryMap, setInventoryMap] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormData>({
    defaultValues: {
      type: "bale",
      delivery: "pickup",
      quantity: 1,
      product: undefined,
    }
  });

  // Fetch Inventory
  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => setInventoryMap(data.inventory))
      .catch(err => console.error("Inventory load failed", err));
  }, []);

  const selectedProduct = watch("product");
  const deliveryMethod = watch("delivery");
  const quantity = watch("quantity");
  const unitType = watch("type");

  // Load from cookie
  useEffect(() => {
    const fields = ["firstName", "lastName", "email", "phone", "product", "quantity", "type", "delivery", "feedback", "address"];
    fields.forEach(field => {
      const saved = getCookie(`form_${field}`);
      if (saved && typeof saved === "string") {
        if (field === "quantity") {
          setValue(field as keyof FormData, parseInt(saved));
        } else {
          setValue(field as keyof FormData, saved);
        }
      }
    });
  }, [setValue]);

  // Watch & Autosave
  const watchedValues = watch();
  useEffect(() => {
    Object.entries(watchedValues).forEach(([key, value]) => {
      if (value) setCookie(`form_${key}`, value, { maxAge: 60 * 60 * 24 * 7 });
    });
  }, [watchedValues]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error("Submission failed");

      alert(result.warning || "Order Submitted Successfully!");
      if (!result.warning) {
        // Clear cookies
        ["firstName", "lastName", "email", "phone", "product", "quantity", "type", "delivery", "feedback", "address"].forEach(f => deleteCookie(`form_${f}`));
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting order");
    }
  };

  const getPriceEstimate = () => {
    if (!quantity || isNaN(quantity)) return "";
    // Basic logic
    if (unitType === 'bale') return `~$${quantity * 10}`;
    return "";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full max-w-2xl mx-auto pb-20">

      {/* SECTION 1: PRODUCT SELECTION */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">What are you looking for?</h2>
        <div className="grid grid-cols-2 gap-4">
          <SelectionCard
            title="Alfalfa"
            price="$14 / bale"
            inventoryCount={inventoryMap['alfalfa'] || "..."}
            selected={selectedProduct === 'alfalfa'}
            onClick={() => setValue('product', 'alfalfa')}
            imageUrl="/images/alfalfa.png"
            className="h-48 md:h-56"
          />
          <SelectionCard
            title="Wheat Hay"
            price="$10 / bale"
            inventoryCount={inventoryMap['wheat'] || "..."}
            selected={selectedProduct === 'wheat'}
            onClick={() => setValue('product', 'wheat')}
            imageUrl="/images/wheat.png"
            className="h-48 md:h-56"
          />
        </div>
      </section>

      {/* SECTION 2: QUANTITY & UNIT */}
      <section className="space-y-6 animate-slide-up">
        <h3 className="text-2xl font-bold text-gray-900">How much do you need?</h3>

        {/* 3-Card Quantity/Unit Selection */}
        <div className="grid grid-cols-3 gap-3">
          <SelectionCard
            title="Bales"
            price="Single"
            selected={unitType === 'bale'}
            onClick={() => { setValue('type', 'bale'); }}
            className="h-32"
          />
          <SelectionCard
            title="Block"
            price="~74 Bales"
            selected={unitType === 'block'}
            onClick={() => { setValue('type', 'block'); }}
            className="h-32"
          />
          <SelectionCard
            title="Truck"
            price="~500 Bales"
            selected={unitType === 'truck'}
            onClick={() => { setValue('type', 'truck'); }}
            className="h-32"
          />
        </div>

        {/* Counter Component for Quantity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fade-in flex flex-col items-center">
          <div className="mb-4 text-center">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              {unitType === 'block' ? "Blocks (4x4x8)" : unitType === 'truck' ? "Truckloads" : "Bales"}
            </p>
            {unitType === 'block' && <p className="text-xs text-green-600 font-medium mt-1">1 Block ≈ 74 Bales</p>}
          </div>
          <Counter
            value={quantity}
            onChange={(val) => setValue('quantity', val)}
            min={1}
            max={unitType === 'truck' ? 10 : 9999}
          />
        </div>
      </section>

      {/* SECTION 3: FULFILLMENT */}
      <section className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">How should we get it to you?</h3>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setValue('delivery', 'pickup')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-[#1e3a1e] bg-[#fdfdfc] shadow-md scale-[1.01]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="font-bold text-gray-900">Farm Pickup</div>
              <div className="text-sm text-gray-500">Free, loading included</div>
            </div>

            <div
              onClick={() => setValue('delivery', 'delivered')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === 'delivered' ? 'border-[#1e3a1e] bg-[#fdfdfc] shadow-md scale-[1.01]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="font-bold text-gray-900">Delivery</div>
              <div className="text-sm text-gray-500">+$4/mile</div>
            </div>
          </div>

          {/* OR Separator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-400 shadow-sm z-10">
            OR
          </div>
        </div>

        {/* CONDITIONAL ADDRESS FIELD */}
        {deliveryMethod === 'delivered' && (
          <div className="animate-fade-in pt-2">
            <AirbnbInput
              label="Delivery Address"
              placeholder="123 Farm Lane, Chowchilla CA"
              registration={register("address", { required: true })}
              error={errors.address?.message}
            />
          </div>
        )}
      </section>

      {/* SECTION 4: CONTACT INFO */}
      <section className="space-y-4 pt-8 border-t border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900">Contact Details</h3>

        {/* Name Split */}
        <div className="grid grid-cols-2 gap-4">
          <AirbnbInput
            label="First Name"
            placeholder="Jane"
            registration={register("firstName", { required: "Required" })}
            error={errors.firstName?.message}
          />
          <AirbnbInput
            label="Last Name"
            placeholder="Farmer"
            registration={register("lastName", { required: "Required" })}
            error={errors.lastName?.message}
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-2 gap-4">
          <AirbnbInput
            label="Phone Number"
            type="tel"
            placeholder="(555) 123-4567"
            registration={register("phone", { required: "Phone is required" })}
            error={errors.phone?.message}
          // Mask logic handled inside component
          />
          <AirbnbInput
            label="Email Address"
            type="email"
            placeholder="jane@farm.com"
            registration={register("email", { required: "Email is required" })}
            error={errors.email?.message}
          />
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 ml-1">
            Notes (Optional)
          </label>
          <textarea
            {...register("feedback")}
            className="w-full p-4 text-base bg-white border border-gray-300 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black resize-none h-24"
            placeholder="Gate codes, combine access, etc."
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full py-5 text-xl font-bold text-white 
          bg-gradient-to-r from-[#1e3a1e] to-[#2c532c]
          hover:from-[#162b16] hover:to-[#1e3a1e]
          rounded-2xl shadow-xl hover:shadow-2xl 
          transform transition-all active:scale-[0.98] 
          disabled:opacity-50 disabled:cursor-not-allowed
          mt-8 mb-12
      "
      >
        {isSubmitting ? "Processing..." : `Request Order ${getPriceEstimate()}`}
      </button>

      {isSubmitSuccessful && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
          Request Sent!
        </div>
      )}
    </form>
  );
}
