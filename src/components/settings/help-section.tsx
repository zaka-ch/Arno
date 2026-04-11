"use client"

import { useState } from "react"
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  FileText, 
  ExternalLink, 
  ChevronDown,
  Dumbbell,
  Apple,
  BarChart3,
  CreditCard,
  Shield,
  Zap
} from "lucide-react"
import { Button } from "@/v0-ui/button"
import { Input } from "@/v0-ui/input"
import { Textarea } from "@/v0-ui/textarea"
import { Label } from "@/v0-ui/label"
import { cn } from "@/lib/utils"

const faqCategories = [
  {
    id: "workouts",
    label: "Workouts",
    icon: Dumbbell,
    faqs: [
      {
        question: "How do I create a custom workout plan?",
        answer: "Simply ask Arno to create a workout plan based on your goals. You can specify your experience level, available equipment, and how many days per week you want to train."
      },
      {
        question: "Can I track my progress over time?",
        answer: "Yes! Arno automatically tracks your workouts, PRs, and overall progress. You can view detailed analytics in the right panel or ask Arno for a progress summary."
      },
    ]
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: Apple,
    faqs: [
      {
        question: "How does the meal tracking work?",
        answer: "You can log your meals by telling Arno what you ate, or by using the quick-add feature. Arno will calculate your macros and provide feedback on your nutrition."
      },
      {
        question: "Can Arno create a meal plan for me?",
        answer: "Absolutely! Tell Arno your dietary preferences, restrictions, and goals, and it will generate a personalized meal plan with recipes and shopping lists."
      },
    ]
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    faqs: [
      {
        question: "What metrics does Arno track?",
        answer: "Arno tracks workout frequency, volume, personal records, body measurements, nutrition intake, sleep quality, and more. All data is visualized in easy-to-understand charts."
      },
    ]
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    faqs: [
      {
        question: "How do I cancel my subscription?",
        answer: "You can cancel your subscription anytime from Settings > Subscription. You'll continue to have access until the end of your billing period."
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes, we offer a 7-day money-back guarantee for new subscribers. Contact our support team within 7 days of your first payment for a full refund."
      },
    ]
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Shield,
    faqs: [
      {
        question: "Is my data secure?",
        answer: "Yes, we use industry-standard encryption to protect your data. Your fitness information is never sold to third parties."
      },
    ]
  },
]

export function HelpSection() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("workouts")
  const [contactSubject, setContactSubject] = useState("")
  const [contactMessage, setContactMessage] = useState("")

  const currentCategory = faqCategories.find(c => c.id === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold">Help & Support</h2>
        <p className="text-muted-foreground text-sm mt-1">Get answers to common questions or contact us</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="#faq" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
          <HelpCircle className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">FAQ</span>
        </a>
        <a href="#contact" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
          <MessageCircle className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Live Chat</span>
        </a>
        <a href="#contact" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
          <Mail className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Email Us</span>
        </a>
        <a href="https://docs.arno.fit" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
          <FileText className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium">Documentation</span>
        </a>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {faqCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <category.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {currentCategory?.faqs.map((faq, index) => {
            const faqId = `${selectedCategory}-${index}`
            return (
              <div
                key={faqId}
                className="rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faqId ? null : faqId)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                    expandedFaq === faqId && "rotate-180"
                  )} />
                </button>
                {expandedFaq === faqId && (
                  <div className="px-4 pb-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Contact Form */}
      <div id="contact" className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Support</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What do you need help with?"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your issue or question in detail..."
              rows={5}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
            />
          </div>
          <Button className="gap-2">
            <Mail className="w-4 h-4" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Resources</h3>
        <div className="space-y-3">
          <a
            href="#"
            className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Getting Started Guide</p>
                <p className="text-xs text-muted-foreground">Learn the basics of using Arno</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">API Documentation</p>
                <p className="text-xs text-muted-foreground">Integrate Arno with other apps</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Community Forum</p>
                <p className="text-xs text-muted-foreground">Connect with other Arno users</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </a>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Arno v2.1.0</p>
        <p className="mt-1">
          <a href="#" className="hover:text-foreground">Terms of Service</a>
          {" • "}
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          {" • "}
          <a href="#" className="hover:text-foreground">Status</a>
        </p>
      </div>
    </div>
  )
}
