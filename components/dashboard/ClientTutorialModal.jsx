import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, Sparkles, FolderOpen, MessageSquare, ThumbsUp, Receipt, PackageCheck, Play } from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    iconBg: "bg-zinc-900",
    iconColor: "text-white",
    title: "Welcome to Your Project 🎬",
    description:
      "Your filmmaker has invited you to this private workspace. Here you can review files, give feedback, view invoices, and stay in sync throughout the project.",
  },
  {
    icon: FolderOpen,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "View Files & Deliverables",
    description:
      'The "Files" tab has reference materials and drafts shared by your filmmaker. The "Deliverables" tab is where you\'ll find final cuts and exports ready for your review.',
    tip: "You'll get notified when new files are uploaded.",
  },
  {
    icon: Play,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    title: "Review Videos with Timestamps",
    description:
      "Click the Review button on any video to watch it and leave timestamped comments. Your feedback is pinned exactly to the moment in the video — no more \"around the 1 minute mark\" guessing.",
    tip: "Click anywhere on the timeline to jump to that point in the video.",
  },
  {
    icon: MessageSquare,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Message Your Filmmaker",
    description:
      'Use the "Messages" tab for general questions or updates. It\'s a direct line to your filmmaker — all in one place, no email threads needed.',
    tip: "You'll see a badge on the Messages tab when there are new messages.",
  },
  {
    icon: ThumbsUp,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    title: "Approve or Request Changes",
    description:
      'The "Feedback" tab is where your filmmaker sends structured approval requests. You can approve the work or request specific revisions — keeping the revision process clean and trackable.',
    tip: "Each feedback request may be tied to a specific file so you always know what's being reviewed.",
  },
  {
    icon: Receipt,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    title: "View Your Invoices",
    description:
      'Track your payment status in the "Invoices" tab. You can see what\'s due, what\'s been paid, and download a PDF copy of any invoice.',
  },
  {
    icon: PackageCheck,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    title: "You're all set!",
    description:
      "That's everything you need to know. Feel free to explore the tabs and reach out to your filmmaker if you have questions.",
    tip: "Bookmark this page to come back any time — your access link is always the same.",
  },
];

export default function ClientTutorialModal({ open, onClose }) {
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
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-zinc-500" />
        </button>

        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100">
          <div
            className="h-1 bg-zinc-900 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="px-8 pt-10 pb-6">
          <div className={`w-12 h-12 rounded-2xl ${current.iconBg} flex items-center justify-center mb-5`}>
            <Icon className={`w-6 h-6 ${current.iconColor}`} />
          </div>

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

        <div className="px-8 pb-7 flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={isFirst}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 disabled:opacity-0 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

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