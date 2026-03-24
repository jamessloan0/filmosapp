import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, FolderPlus, Link, Upload, MessageSquare, ThumbsUp, Receipt, PackageCheck, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    iconBg: "bg-zinc-900",
    iconColor: "text-white",
    title: "Welcome to FilmOS 🎬",
    description:
      "FilmOS is your all-in-one client collaboration platform. Share files, collect feedback, send invoices, and deliver final cuts — all in one place. Let's walk you through the basics.",
    image: null,
  },
  {
    icon: FolderPlus,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    title: "Create a Project",
    description:
      'Hit "New Project" to create a workspace for each client. Add their name and email — that\'s all you need to get started.',
    tip: "Each project gets its own private workspace where you and your client collaborate.",
  },
  {
    icon: Link,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "Share a Client Link",
    description:
      'Inside any project, click "Copy Client Link" and send it to your client. They don\'t need an account — they just enter their name and they\'re in.',
    tip: "The link is unique and secure. Only people with the link can access the project.",
  },
  {
    icon: Upload,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Upload Deliverables",
    description:
      'Go to the "Deliverables" tab to upload your final cuts and exports. You can upload multiple versions of the same file and add a note for each revision.',
    tip: "Clients get an email notification every time you upload a new deliverable.",
  },
  {
    icon: MessageSquare,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Communicate in Context",
    description:
      'Use the "Messages" tab for general chat. For video feedback, clients can leave timestamped comments directly on the video — so feedback is always tied to the exact moment.',
    tip: "You can mark video comments as resolved to track progress.",
  },
  {
    icon: ThumbsUp,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    title: "Request Approval",
    description:
      'The "Feedback" tab lets you send structured approval requests. Clients can approve or request changes — keeping your revision history clean and clear.',
    tip: "Attach a specific file to a feedback request so clients know exactly what to review.",
  },
  {
    icon: Receipt,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    title: "Send Invoices",
    description:
      'Create and track invoices inside each project. Clients can view their payment status directly in the portal, and you can export a PDF version at any time.',
    tip: "Keep all billing tied to the project for a clean paper trail.",
  },
  {
    icon: PackageCheck,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    title: "You're ready to go!",
    description:
      "That covers the essentials. Create your first project and share the link with a client — the whole workflow takes less than 2 minutes to set up.",
    tip: "You can always reopen this guide from the Help button at the top of your dashboard.",
  },
];

export default function TutorialModal({ open, onClose }) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-zinc-500" />
        </button>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100">
          <div
            className="h-1 bg-zinc-900 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-8 pt-10 pb-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-2xl ${current.iconBg} flex items-center justify-center mb-5`}>
            <Icon className={`w-6 h-6 ${current.iconColor}`} />
          </div>

          {/* Step counter */}
          <p className="text-xs text-zinc-400 font-medium mb-2 uppercase tracking-wider">
            Step {step + 1} of {STEPS.length}
          </p>

          <h2 className="text-xl font-bold text-zinc-900 mb-3 leading-snug">{current.title}</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">{current.description}</p>

          {current.tip && (
            <div className="mt-4 flex items-start gap-2 bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-100">
              <span className="text-base mt-0.5">💡</span>
              <p className="text-xs text-zinc-500 leading-relaxed">{current.tip}</p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-8 pb-7 flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={isFirst}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 disabled:opacity-0 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === step ? "w-4 h-1.5 bg-zinc-900" : "w-1.5 h-1.5 bg-zinc-200 hover:bg-zinc-300"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <Button
              onClick={handleClose}
              className="bg-zinc-900 hover:bg-zinc-800 rounded-xl h-9 px-5 text-sm font-semibold"
            >
              Get Started
            </Button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}