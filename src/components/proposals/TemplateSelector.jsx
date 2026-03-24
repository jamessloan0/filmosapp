import React from "react";
import { Button } from "@/components/ui/button";
import { PROPOSAL_TEMPLATES } from "./proposalTemplates";
import { ChevronRight } from "lucide-react";

export default function TemplateSelector({ onSelect, onCancel }) {
  const templates = Object.entries(PROPOSAL_TEMPLATES).map(([key, template]) => ({
    id: key,
    ...template
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Choose a Template</h2>
        <p className="text-sm text-zinc-500">Select a design style to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
          >
            {/* Template preview */}
            <div className="w-full aspect-video bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
              {template.icon}
            </div>

            {/* Template info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-zinc-900">{template.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{template.description}</p>
              </div>
              <Button
                onClick={(e) => { e.stopPropagation(); onSelect(template.id); }}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-8 text-sm"
              >
                Use Template
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}