import React from "react";
import { Type, Image, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function SlideToolbar({ slide, onUpdate, selectedElementId }) {
  const selectedEl = slide?.elements?.find(e => e.id === selectedElementId);

  const addText = () => {
    const el = { id: nanoid(), type: "text", x: 10, y: 10, width: 40, height: 15, content: "", fontSize: 18, color: "#000000", align: "left", bold: false, italic: false, fontFamily: "Arial, sans-serif" };
    onUpdate({ ...slide, elements: [...(slide.elements || []), el] });
  };

  const addImage = () => {
    const el = { id: nanoid(), type: "image", x: 20, y: 20, width: 40, height: 50, src: "" };
    onUpdate({ ...slide, elements: [...(slide.elements || []), el] });
  };

  const updateEl = (patch) => {
    if (!selectedElementId) return;
    onUpdate({ ...slide, elements: slide.elements.map(e => e.id === selectedElementId ? { ...e, ...patch } : e) });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
      {/* Add elements */}
      <div className="flex gap-1 border-r border-zinc-200 pr-2">
        <Button size="sm" variant="outline" onClick={addText} className="h-8 text-xs gap-1">
          <Type className="w-3.5 h-3.5" /> Text
        </Button>
        <Button size="sm" variant="outline" onClick={addImage} className="h-8 text-xs gap-1">
          <Image className="w-3.5 h-3.5" /> Image
        </Button>
      </div>

      {/* Text formatting — only shown when a text element is selected */}
      {selectedEl?.type === "text" && (
        <>
          {/* Font size */}
          <div className="flex items-center gap-1 border-r border-zinc-200 pr-2">
            <button onClick={() => updateEl({ fontSize: Math.max(8, (selectedEl.fontSize || 18) - 2) })} className="w-7 h-7 rounded hover:bg-zinc-200 flex items-center justify-center">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs w-6 text-center font-mono">{selectedEl.fontSize || 18}</span>
            <button onClick={() => updateEl({ fontSize: Math.min(96, (selectedEl.fontSize || 18) + 2) })} className="w-7 h-7 rounded hover:bg-zinc-200 flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Bold / italic */}
          <div className="flex gap-1 border-r border-zinc-200 pr-2">
            <button onClick={() => updateEl({ bold: !selectedEl.bold })} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${selectedEl.bold ? "bg-zinc-900 text-white" : "hover:bg-zinc-200"}`}>
              B
            </button>
            <button onClick={() => updateEl({ italic: !selectedEl.italic })} className={`w-7 h-7 rounded flex items-center justify-center text-xs italic transition-colors ${selectedEl.italic ? "bg-zinc-900 text-white" : "hover:bg-zinc-200"}`}>
              I
            </button>
          </div>

          {/* Font family */}
          <div className="border-r border-zinc-200 pr-2">
            <Select value={selectedEl.fontFamily || "Arial, sans-serif"} onValueChange={(val) => updateEl({ fontFamily: val })}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                <SelectItem value="'Raleway', sans-serif">Raleway</SelectItem>
                <SelectItem value="'Nunito', sans-serif">Nunito</SelectItem>
                <SelectItem value="'DM Sans', sans-serif">DM Sans</SelectItem>
                <SelectItem value="'Josefin Sans', sans-serif">Josefin Sans</SelectItem>
                <SelectItem value="'Cormorant Garamond', serif">Cormorant Garamond</SelectItem>
                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                <SelectItem value="Impact, sans-serif">Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-zinc-200 pr-2">
            {[
              { align: "left", icon: AlignLeft },
              { align: "center", icon: AlignCenter },
              { align: "right", icon: AlignRight },
            ].map(({ align, icon: Icon }) => (
              <button
                key={align}
                onClick={() => updateEl({ align })}
                className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${selectedEl.align === align ? "bg-zinc-900 text-white" : "hover:bg-zinc-200"}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Color */}
          <div className="flex items-center gap-1">
            <label className="text-xs text-zinc-500">Color</label>
            <input
              type="color"
              value={selectedEl.color || "#000000"}
              onChange={(e) => updateEl({ color: e.target.value })}
              className="w-7 h-7 rounded border border-zinc-200 cursor-pointer p-0.5"
            />
          </div>
        </>
      )}

      {selectedEl?.type === "image" && (
        <span className="text-xs text-zinc-400">Click the image placeholder to upload a photo</span>
      )}

      {!selectedEl && (
        <span className="text-xs text-zinc-400">Click an element to select and format it</span>
      )}
    </div>
  );
}