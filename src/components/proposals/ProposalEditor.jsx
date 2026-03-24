import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import SlideCanvas from "./SlideCanvas";
import SlideToolbar from "./SlideToolbar";

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptySlide() {
  return { id: nanoid(), elements: [] };
}

export default function ProposalEditor({ proposal, onSave, onCancel }) {
  const [title, setTitle] = useState(proposal?.title || "");
  const [slides, setSlides] = useState(() => {
    if (proposal?.slides?.length) {
      // Migrate old slide format if needed
      return proposal.slides.map(s => s.elements ? s : { id: nanoid(), elements: [] });
    }
    return [emptySlide()];
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedElId, setSelectedElId] = useState(null);
  const [saving, setSaving] = useState(false);

  const currentSlide = slides[currentIdx];

  const updateCurrentSlide = (updated) => {
    setSlides(prev => prev.map((s, i) => i === currentIdx ? updated : s));
  };

  const addSlide = () => {
    const ns = emptySlide();
    setSlides(prev => [...prev, ns]);
    setCurrentIdx(slides.length);
    setSelectedElId(null);
  };

  const deleteSlide = (idx) => {
    if (slides.length === 1) return;
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    setCurrentIdx(Math.min(idx, next.length - 1));
    setSelectedElId(null);
  };

  const goTo = (idx) => {
    setCurrentIdx(idx);
    setSelectedElId(null);
  };

  const handleSave = async (asDraft) => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(title, slides, asDraft);
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Title */}
      <div>
        <Label className="text-xs text-zinc-500 mb-1 block">Proposal Title</Label>
        <Input
          placeholder="e.g. Wedding Film Proposal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Slide strip */}
        <div className="w-28 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => goTo(i)}
              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${i === currentIdx ? "border-sky-500" : "border-zinc-200 hover:border-zinc-300"}`}
              style={{ aspectRatio: "16/9", background: "#fff" }}
            >
              <SlideCanvas
                slide={slide}
                onUpdate={() => {}}
                selectedElementId={null}
                onSelectElement={() => {}}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-zinc-300 font-medium">{i + 1}</span>
              </div>
              {slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSlide(i); }}
                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addSlide}
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 hover:border-sky-400 text-zinc-400 hover:text-sky-500 transition-all"
            style={{ aspectRatio: "16/9" }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Main editor area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <SlideToolbar
            slide={currentSlide}
            onUpdate={updateCurrentSlide}
            selectedElementId={selectedElId}
          />

          <div className="relative flex-1">
            <SlideCanvas
              slide={currentSlide}
              onUpdate={updateCurrentSlide}
              selectedElementId={selectedElId}
              onSelectElement={setSelectedElId}
            />

            {/* Slide navigation arrows */}
            {slides.length > 1 && (
              <div className="flex items-center justify-center gap-3 mt-2">
                <button onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-zinc-400">{currentIdx + 1} / {slides.length}</span>
                <button onClick={() => goTo(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx === slides.length - 1} className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-zinc-100">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button variant="outline" onClick={() => handleSave(true)} disabled={saving || !title.trim()} className="flex-1">
          Save as Draft
        </Button>
        <Button onClick={() => handleSave(false)} disabled={saving || !title.trim()} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Save & Send
        </Button>
      </div>
    </div>
  );
}