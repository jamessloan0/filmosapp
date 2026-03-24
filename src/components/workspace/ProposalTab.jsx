import React, { useState } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, XCircle, Presentation } from "lucide-react";
import ProposalEditor from "@/components/proposals/ProposalEditor";
import SlideViewer from "@/components/proposals/SlideViewer";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-zinc-100 text-zinc-600" },
  sent: { label: "Sent", color: "bg-sky-100 text-sky-700" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  changes_requested: { label: "Changes Requested", color: "bg-amber-100 text-amber-700" },
};

export default function ProposalTab({ proposals, projectId, isClient, clientName, onUpdated }) {
  const [editing, setEditing] = useState(null); // null | "new" | proposal object
  const [viewingProposal, setViewingProposal] = useState(null);
  const [viewSlideIdx, setViewSlideIdx] = useState(0);
  const [responding, setResponding] = useState(false);

  const handleCreateBlank = () => {
    setEditing("new");
  };

  const handleSave = async (title, slides, asDraft) => {
    const status = asDraft ? "draft" : "sent";
    if (editing === "new") {
      await entities.Proposal.create({ project_id: projectId, title, slides, status });
    } else {
      await entities.Proposal.update(editing.id, { title, slides, status });
    }
    setEditing(null);
    onUpdated();
  };

  const handleRespond = async (proposal, decision, note) => {
    setResponding(true);
    await entities.Proposal.update(proposal.id, {
      status: decision,
      client_decision: note,
      client_name: clientName,
    });
    setViewingProposal(null);
    setResponding(false);
    onUpdated();
  };

  if (editing) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6" style={{ minHeight: 600 }}>
        <ProposalEditor
          proposal={editing === "new" ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  if (viewingProposal) {
    return (
      <ProposalViewModal
        proposal={viewingProposal}
        slideIdx={viewSlideIdx}
        setSlideIdx={setViewSlideIdx}
        isClient={isClient}
        responding={responding}
        onRespond={handleRespond}
        onEdit={() => { setEditing(viewingProposal); setViewingProposal(null); }}
        onClose={() => setViewingProposal(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {!isClient && (
        <div className="flex justify-end">
          <Button onClick={handleCreateBlank} className="bg-zinc-900 hover:bg-zinc-800">
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Button>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <Presentation className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            {isClient ? "No proposals have been sent yet." : "No proposals yet. Create one to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {proposals.map((proposal) => {
            const cfg = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
            const slideCount = proposal.slides?.length || 0;
            return (
              <div
                key={proposal.id}
                className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => { setViewingProposal(proposal); setViewSlideIdx(0); }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    <Presentation className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{proposal.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{slideCount} slide{slideCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <Badge className={`${cfg.color} border-0 flex-shrink-0`}>{cfg.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProposalViewModal({ proposal, slideIdx, setSlideIdx, isClient, responding, onRespond, onEdit, onClose }) {
  const [note, setNote] = useState("");
  const slides = proposal.slides || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{proposal.title}</h2>
          <p className="text-xs text-zinc-400">{slides.length} slide{slides.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {!isClient && (
            <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Back</Button>
        </div>
      </div>

      <SlideViewer
        slides={slides}
        currentIndex={slideIdx}
        onPrev={() => setSlideIdx(i => Math.max(0, i - 1))}
        onNext={() => setSlideIdx(i => Math.min(slides.length - 1, i + 1))}
      />

      {isClient && proposal.status === "sent" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-zinc-700">Your Response</p>
          <textarea
            className="w-full border border-zinc-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
            rows={3}
            placeholder="Add a note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => onRespond(proposal, "approved", note)}
              disabled={responding}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => onRespond(proposal, "changes_requested", note)}
              disabled={responding}
              variant="outline"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Request Changes
            </Button>
          </div>
        </div>
      )}

      {proposal.status !== "draft" && proposal.status !== "sent" && proposal.client_decision && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Client note from {proposal.client_name}</p>
          <p className="text-sm text-zinc-700">{proposal.client_decision}</p>
        </div>
      )}
    </div>
  );
}