"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

export type PricingOption = {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year" | "one-time" | "quarter";
  description: string;
  features: string[];
  popular?: boolean;
  stripePriceId?: string;
  secretCode?: string;
};

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (option: PricingOption) => void;
  userEmail: string;
  preSelectPlan?: string; // 'basic', 'advanced', 'premium', 'unlimited', 'addon'
}

export function PricingModal({ isOpen, onClose, onSelectPlan, userEmail, preSelectPlan }: PricingModalProps) {
  const [selectedOption, setSelectedOption] = useState<PricingOption | null>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [priceIds, setPriceIds] = useState<{
    basic?: string;
    advanced?: string;
    premium?: string;
    unlimited?: string;
    addon?: string;
  }>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  // Fetch price IDs from backend
  useEffect(() => {
    const fetchPriceIds = async () => {
      try {
        const response = await fetch("/api/billing/price-ids");
        const data = await response.json();
        setPriceIds(data);
      } catch (error) {
        console.error("Failed to fetch price IDs:", error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    if (isOpen) {
      fetchPriceIds();
    }
  }, [isOpen]);

  const PRICING_OPTIONS: PricingOption[] = useMemo(() => [
    {
      id: "basic",
      name: "Basic Plan",
      price: 99,
      currency: "USD",
      interval: "month",
      description: "4 tutoring sessions per month",
      features: [
        "4 tutoring sessions per month",
        "Personalized vocabulary deck",
        "Progress tracking",
        "Email support",
        "Add-on sessions available"
      ],
      stripePriceId: priceIds.basic
    },
    {
      id: "advanced",
      name: "Advanced Plan",
      price: 179,
      currency: "USD", 
      interval: "month",
      description: "8 tutoring sessions per month",
      features: [
        "8 tutoring sessions per month",
        "Everything in Basic",
        "Priority scheduling",
        "Advanced progress analytics",
        "Add-on sessions available"
      ],
      popular: true,
      stripePriceId: priceIds.advanced
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: 249,
      currency: "USD",
      interval: "month",
      description: "12 tutoring sessions per month",
      features: [
        "12 tutoring sessions per month",
        "Everything in Advanced",
        "Flexible scheduling",
        "Priority support",
        "Add-on sessions available"
      ],
      stripePriceId: priceIds.premium
    },
    {
      id: "unlimited",
      name: "Unlimited Plan",
      price: 399,
      currency: "USD",
      interval: "month",
      description: "30 tutoring sessions per month",
      features: [
        "30 tutoring sessions per month",
        "Everything in Premium",
        "Maximum flexibility",
        "VIP support",
        "Add-on sessions available"
      ],
      stripePriceId: priceIds.unlimited
    },
    {
      id: "addon",
      name: "Single Session",
      price: 29,
      currency: "USD",
      interval: "one-time",
      description: "Purchase a single tutoring session",
      features: [
        "1 additional tutoring session",
        "Same quality as monthly plan",
        "No commitment",
        "Perfect for extra practice"
      ],
      stripePriceId: priceIds.addon
    },
    {
      id: "trial",
      name: "Training Access",
      price: 0,
      currency: "USD",
      interval: "one-time",
      description: "Special access for training",
      features: [
        "Full access for 30 days",
        "All features included",
        "No credit card required",
        "Training purposes only"
      ],
      secretCode: "TRAINING2024"
    }
  ], [priceIds]);

  // Pre-select plan when modal opens
  useEffect(() => {
    if (isOpen && preSelectPlan && !isLoadingPrices) {
      const planToSelect = PRICING_OPTIONS.find(option => option.id === preSelectPlan);
      if (planToSelect) {
        setSelectedOption(planToSelect);
      }
    }
  }, [isOpen, preSelectPlan, isLoadingPrices, PRICING_OPTIONS]);

  const handleSelectOption = useCallback((option: PricingOption) => {
    setSelectedOption(option);
    setCodeError("");
    setEnteredCode("");
  }, []);

  const handleCodeSubmit = useCallback(async () => {
    if (!selectedOption?.secretCode) return;
    
    setIsCheckingCode(true);
    setCodeError("");

    try {
      const response = await fetch("/api/billing/validate-secret-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          code: enteredCode
        })
      });

      const data = await response.json();
      
              if (data.valid) {
          // Show success message with duration info
          const durationText = data.duration === 1 ? "1 day" : `${data.duration} days`;
          alert(`✅ Code validated! You now have ${durationText} of ${data.description}.`);
          onSelectPlan(selectedOption);
        } else {
          setCodeError(data.error || "Invalid code. Please try again.");
        }
    } catch (error) {
      setCodeError("Something went wrong. Please try again.");
    } finally {
      setIsCheckingCode(false);
    }
  }, [selectedOption, enteredCode, userEmail, onSelectPlan]);

  const handleCheckout = useCallback(async () => {
    if (!selectedOption) return;
    
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          priceId: selectedOption.stripePriceId,
          returnTo: `${window.location.origin}/student/${encodeURIComponent(userEmail)}`
        })
      });

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to start checkout. Please try again.");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    }
  }, [selectedOption, userEmail]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Choose Your Plan</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Select the plan that best fits your learning goals
          </p>
        </div>

        {/* Pricing Options */}
        <div className="p-6">
          {isLoadingPrices ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pricing options...</p>
            </div>
          ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_OPTIONS.map((option) => (
              <div
                key={option.id}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedOption?.id === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${option.popular ? "ring-2 ring-blue-200" : ""}`}
                onClick={() => handleSelectOption(option)}
              >
                {option.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {option.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-800">
                      ${option.price}
                    </span>
                    {option.interval === "month" && (
                      <span className="text-gray-600">/month</span>
                    )}
                    {option.interval === "year" && (
                      <span className="text-gray-600">/year</span>
                    )}
                    {option.interval === "quarter" && (
                      <span className="text-gray-600">/quarter</span>
                    )}
                    {option.interval === "one-time" && (
                      <span className="text-gray-600"> one-time</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {option.description}
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <div className={`w-full py-2 px-4 rounded-lg font-semibold ${
                    selectedOption?.id === option.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedOption?.id === option.id ? "Selected" : "Select Plan"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Action Buttons */}
          {selectedOption && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                Complete Your Selection
              </h3>
              
              {selectedOption.secretCode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Secret Code
                    </label>
                    <input
                      type="text"
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value)}
                      placeholder="Enter your secret code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    {codeError && (
                      <p className="text-red-500 text-sm mt-1">{codeError}</p>
                    )}
                  </div>
                  <button
                    onClick={handleCodeSubmit}
                    disabled={!enteredCode.trim() || isCheckingCode}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingCode ? "Validating..." : "Activate Free Trial"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Continue to Checkout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
