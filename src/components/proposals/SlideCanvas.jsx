import React, { useRef, useState, useCallback, useEffect } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { supabase } from '@/api/supabaseClient';
import { Image, Loader2, X } from "lucide-react";

const HANDLES = [
  { id: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
  { id: "n",  style: { top: -5, left: "calc(50% - 5px)", cursor: "n-resize" } },
  { id: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
  { id: "e",  style: { top: "calc(50% - 5px)", right: -5, cursor: "e-resize" } },
  { id: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
  { id: "s",  style: { bottom: -5, left: "calc(50% - 5px)", cursor: "s-resize" } },
  { id: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
  { id: "w",  style: { top: "calc(50% - 5px)", left: -5, cursor: "w-resize" } },
];

export default function SlideCanvas({ slide, onUpdate, selectedElementId, onSelectElement }) {
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useRef(null);
  const pendingImageIdRef = useRef(null);

  const getRect = () => canvasRef.current?.getBoundingClientRect();
  const toPct = (px, dim) => (px / dim) * 100;

  const startInteraction = (e, elementId, isResize = false, handle = null) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectElement(elementId);
    if (editingTextId !== elementId) setEditingTextId(null);

    const rect = getRect();
    if (!rect) return;
    const el = slide.elements.find(x => x.id === elementId);
    if (!el) return;

    if (isResize) {
      setResizing({ elementId, handle, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, origW: el.width, origH: el.height });
    } else {
      setDragging({ elementId, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y });
    }
  };

  const handleMouseMove = useCallback((e) => {
    const rect = getRect();
    if (!rect) return;

    if (dragging) {
      const dx = toPct(e.clientX - dragging.startX, rect.width);
      const dy = toPct(e.clientY - dragging.startY, rect.height);
      const el = slide.elements.find(x => x.id === dragging.elementId);
      if (!el) return;
      onUpdate({
        ...slide,
        elements: slide.elements.map(x =>
          x.id === dragging.elementId
            ? { ...x, x: Math.max(0, Math.min(100 - x.width, dragging.origX + dx)), y: Math.max(0, Math.min(100 - x.height, dragging.origY + dy)) }
            : x
        ),
      });
    }

    if (resizing) {
      const dx = toPct(e.clientX - resizing.startX, rect.width);
      const dy = toPct(e.clientY - resizing.startY, rect.height);
      let { origX: nx, origY: ny, origW: nw, origH: nh } = resizing;

      if (resizing.handle.includes("e")) nw = Math.max(10, resizing.origW + dx);
      if (resizing.handle.includes("s")) nh = Math.max(5, resizing.origH + dy);
      if (resizing.handle.includes("w")) { nw = Math.max(10, resizing.origW - dx); nx = resizing.origX + (resizing.origW - nw); }
      if (resizing.handle.includes("n")) { nh = Math.max(5, resizing.origH - dy); ny = resizing.origY + (resizing.origH - nh); }

      onUpdate({
        ...slide,
        elements: slide.elements.map(x =>
          x.id === resizing.elementId ? { ...x, x: nx, y: ny, width: nw, height: nh } : x
        ),
      });
    }
  }, [dragging, resizing, slide, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingImageIdRef.current) return;
    const elementId = pendingImageIdRef.current;
    setUploadingId(elementId);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `proposal-images/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl: file_url } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);
      onUpdate({ ...slide, elements: slide.elements.map(x => x.id === elementId ? { ...x, src: file_url } : x) });
    } finally {
      setUploadingId(null);
      pendingImageIdRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteElement = (e, elementId) => {
    e.stopPropagation();
    onUpdate({ ...slide, elements: slide.elements.filter(x => x.id !== elementId) });
    onSelectElement(null);
  };

  const isEmpty = !slide.elements?.length;

  return (
    <div
      ref={canvasRef}
      className="relative w-full bg-white rounded-lg overflow-hidden select-none shadow-lg"
      style={{ aspectRatio: "16/9", cursor: dragging ? "grabbing" : "default" }}
      onClick={(e) => { if (e.target === canvasRef.current) { onSelectElement(null); setEditingTextId(null); } }}
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-zinc-300 text-sm">Use the toolbar above to add text or images</p>
        </div>
      )}

      {(slide.elements || []).map((el) => {
        const isSelected = selectedElementId === el.id;
        return (
          <div
            key={el.id}
            className={`absolute ${isSelected ? "outline outline-2 outline-sky-500 outline-offset-0 z-10" : ""}`}
            style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`, cursor: dragging?.elementId === el.id ? "grabbing" : "grab" }}
            onMouseDown={(e) => startInteraction(e, el.id)}
            onDoubleClick={() => el.type === "text" && setEditingTextId(el.id)}
          >
            {/* Delete button */}
            {isSelected && (
              <button
                className="absolute -top-3 -right-3 z-20 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => deleteElement(e, el.id)}
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Text element */}
            {el.type === "text" && (
              editingTextId === el.id ? (
                <textarea
                  autoFocus
                  className="w-full h-full resize-none border-none outline-none bg-transparent p-1 leading-tight"
                  style={{ fontSize: `${el.fontSize || 18}px`, color: el.color || "#000000", fontWeight: el.bold ? "bold" : "normal", fontStyle: el.italic ? "italic" : "normal", textAlign: el.align || "left", fontFamily: el.fontFamily || "sans-serif" }}
                  value={el.content || ""}
                  onChange={(e) => onUpdate({ ...slide, elements: slide.elements.map(x => x.id === el.id ? { ...x, content: e.target.value } : x) })}
                  onMouseDown={(e) => e.stopPropagation()}
                  onBlur={() => setEditingTextId(null)}
                />
              ) : (
                <div
                  className="w-full h-full p-1 overflow-hidden leading-tight"
                  style={{ fontSize: `${el.fontSize || 18}px`, color: el.color || "#000000", fontWeight: el.bold ? "bold" : "normal", fontStyle: el.italic ? "italic" : "normal", textAlign: el.align || "left", whiteSpace: "pre-wrap", fontFamily: el.fontFamily || "sans-serif" }}
                >
                  {el.content || <span className="text-zinc-300 italic" style={{ fontSize: 12 }}>Double-click to edit</span>}
                </div>
              )
            )}

            {/* Image element */}
            {el.type === "image" && (
              uploadingId === el.id ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-100 rounded">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : el.src ? (
                <img src={el.src} alt="" className="w-full h-full object-cover rounded" draggable={false} />
              ) : (
                <div
                  className="w-full h-full border-2 border-dashed border-zinc-300 rounded flex flex-col items-center justify-center gap-1 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={(e) => { e.stopPropagation(); pendingImageIdRef.current = el.id; fileInputRef.current?.click(); }}
                >
                  <Image className="w-5 h-5 text-zinc-400" />
                  <span className="text-xs text-zinc-400">Click to upload image</span>
                </div>
              )
            )}

            {/* Resize handles */}
            {isSelected && HANDLES.map(h => (
              <div
                key={h.id}
                className="absolute w-2.5 h-2.5 bg-white border-2 border-sky-500 rounded-sm z-10"
                style={h.style}
                onMouseDown={(e) => startInteraction(e, el.id, true, h.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}