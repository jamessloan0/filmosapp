import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function SlideRenderer({ slide }) {
  if (!slide?.elements?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white rounded-lg">
        <span className="text-zinc-300 text-sm">Empty slide</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      {slide.elements.map((el) => (
        <div
          key={el.id}
          className="absolute"
          style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%` }}
        >
          {el.type === "text" && (
            <div
              className="w-full h-full p-1 overflow-hidden leading-tight"
              style={{
                fontSize: `${el.fontSize || 18}px`,
                color: el.color || "#000000",
                fontWeight: el.bold ? "bold" : "normal",
                fontStyle: el.italic ? "italic" : "normal",
                textAlign: el.align || "left",
                whiteSpace: "pre-wrap",
              }}
            >
              {el.content}
            </div>
          )}
          {el.type === "image" && el.src && (
            <img src={el.src} alt="" className="w-full h-full object-cover rounded" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SlideViewer({ slides, currentIndex, onPrev, onNext }) {
  const slide = slides[currentIndex];
  if (!slide) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-900 shadow-xl" style={{ aspectRatio: "16/9" }}>
      <div className="absolute inset-0 p-0">
        <SlideRenderer slide={slide} />
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center disabled:opacity-30 transition-all z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNext}
            disabled={currentIndex === slides.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center disabled:opacity-30 transition-all z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}