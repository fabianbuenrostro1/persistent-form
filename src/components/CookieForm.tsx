"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import SelectionCard from "./SelectionCard";
import AirbnbInput from "./AirbnbInput";
import Counter from "./Counter";
import dynamic from "next/dynamic";

const AddressAutofill = dynamic(
  () => import('@mapbox/search-js-react').then(mod => mod.AddressAutofill),
  { ssr: false }
);

// ======== PRICING CONSTANTS ========
const PRICING: Record<string, number> = {
  alfalfa: 14,
  wheat: 10,
};

const UNIT_MULTIPLIERS: Record<string, number> = {
  bale: 1,
  block: 74,
  truck: 500,
};

const DELIVERY_RATE_PER_MILE = 4;

// Warehouse: 8717 Cressey Way, Winton, CA 95388
const WAREHOUSE_COORDS: [number, number] = [-120.6133, 37.3894]; // [lon, lat]

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmJ1ZW5yb3N0cm8iLCJhIjoiY21pbmpqa3hxMmJpcTNmcHZ2c3AxbGo0NiJ9.n1skSyZcAQ1WMbgqWjSqtA";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  product: string;
  quantity: number;
  type: string;
  delivery: string;
  address?: string;
  feedback: string;
};

export default function CookieForm() {
  const [inventoryMap, setInventoryMap] = useState<Record<string, string>>({});

  // Distance Calculation State
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  // Confirmation Screen State
  const [orderComplete, setOrderComplete] = useState(false);
  const [lastOrderData, setLastOrderData] = useState<FormData | null>(null);
  const [lastOrderTotal, setLastOrderTotal] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes in ms

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

  // Fetch Distance when destination coordinates change
  useEffect(() => {
    if (!destCoords) {
      setDistanceMiles(null);
      return;
    }

    const fetchDistance = async () => {
      setIsCalculatingDistance(true);
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${WAREHOUSE_COORDS[0]},${WAREHOUSE_COORDS[1]};${destCoords[0]},${destCoords[1]}?access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          const distanceMeters = data.routes[0].distance;
          const miles = distanceMeters / 1609.34; // Convert meters to miles
          setDistanceMiles(Math.round(miles * 10) / 10); // Round to 1 decimal
        }
      } catch (err) {
        console.error("Distance calculation failed:", err);
        setDistanceMiles(null);
      } finally {
        setIsCalculatingDistance(false);
      }
    };

    fetchDistance();
  }, [destCoords]);


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

  // Check for existing cooldown on mount
  useEffect(() => {
    const lastOrderTime = localStorage.getItem('lastOrderTimestamp');
    if (lastOrderTime) {
      const elapsed = Date.now() - parseInt(lastOrderTime);
      if (elapsed < COOLDOWN_DURATION) {
        setOrderComplete(true);
        setCooldownRemaining(COOLDOWN_DURATION - elapsed);
        // Try to restore last order data
        const savedData = localStorage.getItem('lastOrderData');
        const savedTotal = localStorage.getItem('lastOrderTotal');
        if (savedData) setLastOrderData(JSON.parse(savedData));
        if (savedTotal) setLastOrderTotal(parseFloat(savedTotal));
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const onSubmit = async (data: FormData) => {
    try {
      // Calculate financials for submission
      const subtotal = calculateProductSubtotal();
      const deliveryFee = calculateDeliveryFee();
      const grandTotal = subtotal + deliveryFee;

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // Financial data
          distanceMiles: distanceMiles || 0,
          deliveryFee,
          productSubtotal: subtotal,
          estimatedTotal: grandTotal,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error("Submission failed");

      // Store order data for confirmation screen
      setLastOrderData(data);
      setLastOrderTotal(grandTotal);
      localStorage.setItem('lastOrderTimestamp', Date.now().toString());
      localStorage.setItem('lastOrderData', JSON.stringify(data));
      localStorage.setItem('lastOrderTotal', grandTotal.toString());

      // Clear form cookies
      ["firstName", "lastName", "email", "phone", "product", "quantity", "type", "delivery", "feedback", "address"].forEach(f => deleteCookie(`form_${f}`));

      // Show confirmation screen
      setOrderComplete(true);
      setCooldownRemaining(COOLDOWN_DURATION);

    } catch (error) {
      console.error(error);
      alert("Error submitting order");
    }
  };

  // Reset form for new order
  const handleNewOrder = () => {
    setOrderComplete(false);
    setLastOrderData(null);
    setLastOrderTotal(0);
    setCooldownRemaining(0);
    localStorage.removeItem('lastOrderTimestamp');
    localStorage.removeItem('lastOrderData');
    localStorage.removeItem('lastOrderTotal');
    window.location.reload();
  };

  // ======== FINANCIAL CALCULATIONS ========
  const calculateProductSubtotal = (): number => {
    if (!selectedProduct || !quantity) return 0;
    const pricePerBale = PRICING[selectedProduct] || 0;
    const multiplier = UNIT_MULTIPLIERS[unitType] || 1;
    return pricePerBale * quantity * multiplier;
  };

  const calculateDeliveryFee = (): number => {
    if (deliveryMethod !== 'delivered' || !distanceMiles) return 0;
    return Math.round(distanceMiles * DELIVERY_RATE_PER_MILE * 100) / 100;
  };

  const calculateGrandTotal = (): number => {
    return calculateProductSubtotal() + calculateDeliveryFee();
  };

  const getTotalBales = (): number => {
    const multiplier = UNIT_MULTIPLIERS[unitType] || 1;
    return quantity * multiplier;
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // ======== CONFIRMATION SCREEN ========
  if (orderComplete) {
    return (
      <div className="space-y-8 w-full max-w-2xl mx-auto pb-20 animate-fade-in">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1e3a1e] to-[#2c532c] rounded-full flex items-center justify-center mx-auto shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1e3a1e]">
            Thank You{lastOrderData?.firstName ? `, ${lastOrderData.firstName}` : ''}!
          </h1>
          <p className="text-gray-600">Your order request has been submitted successfully.</p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-gradient-to-br from-[#fdfdf9] to-[#f8f7f4] p-6 rounded-2xl border-2 border-[#d4a34c]/30 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

          {lastOrderData && (
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Product</span>
                <span className="font-semibold capitalize">{lastOrderData.product}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Quantity</span>
                <span className="font-semibold">{lastOrderData.quantity} {lastOrderData.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Fulfillment</span>
                <span className="font-semibold">{lastOrderData.delivery === 'delivered' ? 'Delivery' : 'Farm Pickup'}</span>
              </div>
              <div className="flex justify-between py-3 mt-2">
                <span className="text-xl font-bold text-[#1e3a1e]">Grand Total</span>
                <span className="text-2xl font-bold text-[#1e3a1e]">${lastOrderTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* What's Next */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">What's Next?</h3>
          <p className="text-gray-600 text-sm">
            We'll review your order and reach out shortly to confirm availability and schedule
            {lastOrderData?.delivery === 'delivered' ? ' delivery' : ' pickup'}.
            A confirmation email has been sent to <strong>{lastOrderData?.email}</strong>.
          </p>
        </div>

        {/* New Order Button */}
        <button
          onClick={handleNewOrder}
          className="w-full py-4 text-lg font-bold text-[#1e3a1e] bg-white border-2 border-[#1e3a1e] hover:bg-[#1e3a1e] hover:text-white rounded-2xl shadow-lg transition-all"
        >
          Create New Order
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full max-w-2xl mx-auto pb-20">

      {/* SECTION 1: PRODUCT SELECTION */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">What are you looking for?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectionCard
            title="Bales"
            price="Single / bale"
            selected={unitType === 'bale'}
            onClick={() => { setValue('type', 'bale'); }}
            className="h-32"
          />
          <SelectionCard
            title="Block"
            price="74 Bales"
            selected={unitType === 'block'}
            onClick={() => { setValue('type', 'block'); }}
            className="h-32"
          />
          <SelectionCard
            title="Truck"
            price="500 Bales"
            selected={unitType === 'truck'}
            onClick={() => { setValue('type', 'truck'); }}
            className="h-32"
          />
        </div>

        {/* Counter Component for Quantity */}
        {/* Counter Component for Quantity */}
        <div className="bg-gray-50/50 p-4 md:p-6 rounded-2xl border border-gray-200/60 shadow-sm animate-fade-in flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-xl font-bold text-gray-900">
              {unitType === 'block' ? "Block" : unitType === 'truck' ? "Truckloads" : "Bales"}
            </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setValue('delivery', 'pickup')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-[#d4a34c] bg-[#fdfdfc] shadow-md scale-[1.01]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="font-bold text-gray-900">Farm Pickup</div>
              <div className="text-sm text-gray-500">Free, loading included</div>
            </div>

            <div
              onClick={() => setValue('delivery', 'delivered')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === 'delivered' ? 'border-[#d4a34c] bg-[#fdfdfc] shadow-md scale-[1.01]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="font-bold text-gray-900">Delivery</div>
              <div className="text-sm text-gray-500">+$4/mile</div>
            </div>
          </div>

          {/* OR Separator - hidden on mobile when stacked */}
          <div className="hidden sm:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full border border-[#d4a34c] bg-white text-xs font-bold text-[#d4a34c] shadow-sm z-10">
            OR
          </div>
        </div>

        {/* CONDITIONAL ADDRESS FIELD */}
        {deliveryMethod === 'delivered' && (
          <div className="animate-fade-in pt-2">
            <AddressAutofill
              accessToken="pk.eyJ1IjoiZmJ1ZW5yb3N0cm8iLCJhIjoiY21pbmpqa3hxMmJpcTNmcHZ2c3AxbGo0NiJ9.n1skSyZcAQ1WMbgqWjSqtA"
              onRetrieve={(res: any) => {
                const feature = res.features?.[0];
                // Use full_address from properties for complete postal address
                const fullAddress = feature?.properties?.full_address || feature?.place_name;
                if (fullAddress) {
                  // Robust overwrite: Wait for Mapbox to finish its default partial filling
                  setTimeout(() => {
                    setValue('address', fullAddress, { shouldValidate: true, shouldDirty: true });
                  }, 100);
                }
                // Capture coordinates for distance calculation
                if (feature?.geometry?.coordinates) {
                  setDestCoords(feature.geometry.coordinates as [number, number]);
                }
              }}
            >
              {/* Use controlled input for proper value sync with react-hook-form */}
              <div className="w-full relative">
                <div className="relative group">
                  <input
                    value={watch('address') || ''}
                    onChange={(e) => setValue('address', e.target.value, { shouldDirty: true })}
                    placeholder=" "
                    autoComplete="shipping address-line1"
                    className={`
                      peer w-full pt-6 pb-2 px-4 text-base text-gray-900 
                      bg-white border rounded-xl outline-none transition-all duration-200
                      placeholder-transparent
                      ${errors.address
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
                    Delivery Address
                  </label>
                </div>
                {errors.address && <p className="mt-1 text-sm text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">Address is required</p>}
              </div>
              {/* Hidden fields to satisfy Mapbox Autofill logic */}
              <input type="hidden" autoComplete="shipping address-level2" />
              <input type="hidden" autoComplete="shipping address-level1" />
              <input type="hidden" autoComplete="shipping postal-code" />
              <input type="hidden" autoComplete="shipping country" />
            </AddressAutofill>
          </div>
        )}
      </section>

      {/* SECTION 4: CONTACT INFO */}
      <section className="space-y-4 pt-8 border-t border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900">Contact Details</h3>

        {/* Name Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* SECTION 5: FINANCIAL SUMMARY */}
      {selectedProduct && (
        <section className="space-y-4 pt-8 border-t border-gray-100 animate-fade-in">
          <h3 className="text-2xl font-bold text-gray-900">Order Summary</h3>

          <div className="bg-gradient-to-br from-[#fdfdf9] to-[#f8f7f4] p-6 rounded-2xl border-2 border-[#d4a34c]/30 shadow-lg">
            {/* Product Line */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <span className="font-semibold text-gray-900 capitalize">{selectedProduct}</span>
                <span className="text-gray-500 text-sm ml-2">
                  ({getTotalBales()} bales @ ${PRICING[selectedProduct]}/bale)
                </span>
              </div>
              <span className="font-bold text-gray-900">${calculateProductSubtotal().toFixed(2)}</span>
            </div>

            {/* Delivery Line */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <span className="font-semibold text-gray-900">Delivery</span>
                {deliveryMethod === 'delivered' ? (
                  <span className="text-gray-500 text-sm ml-2">
                    {isCalculatingDistance ? '(Calculating...)' :
                      distanceMiles ? `(${distanceMiles} mi × $${DELIVERY_RATE_PER_MILE}/mi)` : '(Enter address)'}
                  </span>
                ) : (
                  <span className="text-green-600 text-sm ml-2">(Pickup - Free)</span>
                )}
              </div>
              <span className="font-bold text-gray-900">
                {deliveryMethod === 'pickup' ? 'FREE' :
                  isCalculatingDistance ? '...' :
                    distanceMiles ? `$${calculateDeliveryFee().toFixed(2)}` : '—'}
              </span>
            </div>

            {/* Total Line */}
            <div className="flex justify-between items-center pt-4 mt-2">
              <span className="text-xl font-bold text-[#1e3a1e]">Grand Total</span>
              <span className="text-2xl font-bold text-[#1e3a1e]">
                ${calculateGrandTotal().toFixed(2)}
              </span>
            </div>

            {/* Payment Notice */}
            <p className="text-xl font-bold text-[#1e3a1e] text-center mt-4">
              Cash or Check will be collected at pick up
            </p>

            {deliveryMethod === 'delivered' && !distanceMiles && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Enter your delivery address above to calculate delivery cost.
              </p>
            )}
          </div>
        </section>
      )}

      <button
        type="submit"
        disabled={isSubmitting || (deliveryMethod === 'delivered' && !distanceMiles)}
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
        {isSubmitting ? "Processing..." : `Submit Order • $${calculateGrandTotal().toFixed(2)}`}
      </button>

      {isSubmitSuccessful && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
          Request Sent!
        </div>
      )}
    </form>
  );
}
