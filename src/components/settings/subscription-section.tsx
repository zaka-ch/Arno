"use client"

import { useState } from "react"
import { Crown, Check, MessageSquare, BarChart3, Dumbbell, CreditCard, Receipt, AlertCircle } from "lucide-react"
import { Button } from "@/v0-ui/button"
import { cn } from "@/lib/utils"

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Basic fitness tracking",
    features: [
      "5 AI conversations per day",
      "Basic workout templates",
      "Manual progress tracking",
      "Community forums access",
    ],
    limitations: [
      "Limited AI responses",
      "No personalized plans",
      "Ads included",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "For serious athletes",
    popular: true,
    features: [
      "Unlimited AI conversations",
      "Personalized workout plans",
      "Advanced nutrition tracking",
      "Progress analytics & insights",
      "Priority support",
      "Ad-free experience",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "$19.99",
    period: "/month",
    description: "Maximum results",
    features: [
      "Everything in Pro",
      "1-on-1 video coaching sessions",
      "Custom meal plans",
      "Recovery & sleep optimization",
      "Competition preparation",
      "Early access to features",
    ],
  },
]

const billingHistory = [
  { id: "1", date: "Mar 1, 2024", amount: "$9.99", status: "Paid", plan: "Pro" },
  { id: "2", date: "Feb 1, 2024", amount: "$9.99", status: "Paid", plan: "Pro" },
  { id: "3", date: "Jan 1, 2024", amount: "$9.99", status: "Paid", plan: "Pro" },
]

export function SubscriptionSection() {
  const [currentPlan] = useState("pro")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold">Subscription</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your plan and billing information</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Pro Plan</h3>
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Active
                </span>
              </div>
              <p className="text-muted-foreground text-sm">Renews on April 1, 2024</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">$9.99</div>
            <div className="text-sm text-muted-foreground">per month</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary/20 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Unlimited AI chats</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span>Custom workouts</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>Full analytics</span>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 bg-card rounded-xl border border-border">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={cn(
            "px-4 py-2 rounded-lg transition-all",
            billingCycle === "monthly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={cn(
            "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
            billingCycle === "yearly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Yearly
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            billingCycle === "yearly"
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary/20 text-primary"
          )}>
            Save 20%
          </span>
        </button>
      </div>

      {/* Plan Comparison */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative rounded-2xl border p-6 transition-all",
              currentPlan === plan.id
                ? "bg-primary/5 border-primary"
                : "bg-card border-border hover:border-primary/30",
              plan.popular && "ring-2 ring-primary"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                Most Popular
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold">
                {billingCycle === "yearly" && plan.id !== "free"
                  ? `$${(parseFloat(plan.price.replace("$", "")) * 0.8 * 12).toFixed(0)}`
                  : plan.price}
              </span>
              <span className="text-muted-foreground">
                {billingCycle === "yearly" && plan.id !== "free" ? "/year" : plan.period}
              </span>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
              {plan.limitations?.map((limitation) => (
                <li key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={currentPlan === plan.id ? "outline" : "default"}
              className="w-full"
              disabled={currentPlan === plan.id}
            >
              {currentPlan === plan.id ? "Current Plan" : plan.id === "free" ? "Downgrade" : "Upgrade"}
            </Button>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Payment Method</h3>
          <Button variant="outline" size="sm">
            Update
          </Button>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
          <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Visa ending in 4242</p>
            <p className="text-sm text-muted-foreground">Expires 12/2025</p>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Billing History</h3>
          <Button variant="ghost" size="sm" className="gap-2">
            <Receipt className="w-4 h-4" />
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {billingHistory.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{bill.plan} Plan</p>
                  <p className="text-xs text-muted-foreground">{bill.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{bill.amount}</p>
                <p className="text-xs text-primary">{bill.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Subscription */}
      <div className="bg-muted/30 rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-2">Cancel Subscription</h3>
        <p className="text-muted-foreground text-sm mb-4">
          If you cancel, you&apos;ll still have access to Pro features until April 1, 2024.
        </p>
        <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          Cancel Subscription
        </Button>
      </div>
    </div>
  )
}
