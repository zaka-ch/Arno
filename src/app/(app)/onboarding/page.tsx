import { OnboardingForm } from "@/components/account/onboarding-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arno — Get Started",
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <OnboardingForm />
    </div>
  );
}
