import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, X, Zap } from "lucide-react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';

const MONTHLY_PRICE_ID = "price_1TCnOx7bpL2WPaP2SwgXXT1l";
const YEARLY_PRICE_ID = "price_1TCnOx7bpL2WPaP2yTWjR2c8";

const PRO_FEATURES = [
  "Unlimited projects",
  "Unlimited clients",
  "Unlimited invoices",
  "File uploads up to 20 GB",
  "Extended file storage (14 days)",
  "Priority support",
];

export default function UpgradeModal({ open, onClose, userEmail }) {
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState("yearly"); // default to yearly to emphasize savings

  const isYearly = billing === "yearly";

  const handleUpgrade = async () => {
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app. Please open the app in a new tab.");
      return;
    }

    setLoading(true);
    try {
      const successUrl = `${window.location.origin}/Dashboard?upgraded=true`;
      const cancelUrl = `${window.location.origin}/Dashboard`;

      const res = await invoke("stripeCreateCheckout", {
        priceId: isYearly ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID,
        successUrl,
        cancelUrl,
        userEmail: userEmail || undefined,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert("Could not start checkout. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-zinc-500" />
        </button>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 px-8 py-10 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Upgrade to Pro</h2>
          <p className="text-zinc-400 text-sm">Unlock unlimited projects and 20 GB uploads.</p>
        </div>

        <div className="px-8 py-6 bg-white">
          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex bg-zinc-100 rounded-xl p-1 gap-1 w-full">
              <button
                onClick={() => setBilling("monthly")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${billing === "monthly" ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${billing === "yearly" ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                Yearly
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                  SAVE 14%
                </span>
              </button>
            </div>
          </div>

          {/* Price display */}
          <div className="text-center mb-6">
            {isYearly ? (
              <>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-zinc-900">$25</span>
                  <span className="text-zinc-400 text-sm">/month</span>
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  Billed as <span className="font-semibold text-zinc-700">$300/year</span>
                  <span className="ml-2 text-emerald-600 font-semibold">— save $48 vs monthly</span>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-zinc-900">$29</span>
                  <span className="text-zinc-400 text-sm">/month</span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">Billed monthly · Cancel anytime</p>
              </>
            )}
          </div>

          <ul className="space-y-3 mb-7">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 h-11 text-base font-semibold rounded-xl"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "Redirecting…" : isYearly ? "Subscribe — $300/year" : "Subscribe — $29/month"}
          </Button>
          <p className="text-center text-xs text-zinc-400 mt-3">
            Cancel anytime · Secure payment via Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}