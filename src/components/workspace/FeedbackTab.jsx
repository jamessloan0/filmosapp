import React, { useState } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ThumbsUp, RotateCcw, Clock, MessageSquare, Loader2, CheckCircle2, XCircle, Paperclip } from "lucide-react";

const DECISION_CONFIG = {
  pending: { label: "Awaiting Review", icon: Clock, className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  changes_requested: { label: "Changes Requested", icon: XCircle, className: "bg-orange-50 text-orange-700 border-orange-200" },
};

export default function FeedbackTab({ feedbackItems, projectId, isClient, clientName, onUpdated, files = [] }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", file_id: "", file_name: "" });
  const [respondingId, setRespondingId] = useState(null);
  const [responseForm, setResponseForm] = useState({ decision: "", client_note: "" });

  const handleCreate = async () => {
    if (!form.title) return;
    setCreating(true);
    await entities.Feedback.create({
      project_id: projectId,
      title: form.title,
      description: form.description,
      file_id: form.file_id || "",
      file_name: form.file_name || "",
      decision: "pending",
    });
    await entities.Activity.create({
      project_id: projectId,
      type: "status_change",
      description: `Feedback request created: "${form.title}"`,
      actor_name: "Filmmaker",
    });
    setForm({ title: "", description: "", file_id: "", file_name: "" });
    setCreating(false);
    setOpen(false);
    onUpdated();
  };

  const handleRespond = async (item, decision) => {
    setRespondingId(item.id);
    await entities.Feedback.update(item.id, {
      decision,
      client_note: responseForm[item.id] || "",
      client_name: clientName,
    });
    await entities.Activity.create({
      project_id: projectId,
      type: "status_change",
      description: `${clientName} ${decision === "approved" ? "approved" : "requested changes on"} "${item.title}"`,
      actor_name: clientName,
    });
    setRespondingId(null);
    onUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Create request button (filmmaker only) */}
      {!isClient && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zinc-900 hover:bg-zinc-800">
                <Plus className="w-4 h-4 mr-2" />
                Request Feedback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Feedback Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Review — Cut 1 Draft"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Attach a File (optional)</Label>
                  <Select
                    value={form.file_id || "none"}
                    onValueChange={(val) => {
                      if (val === "none") {
                        setForm({ ...form, file_id: "", file_name: "" });
                      } else {
                        const f = files.find(f => f.id === val);
                        setForm({ ...form, file_id: val, file_name: f?.file_name || "" });
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select a file..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No file attached</SelectItem>
                      {files.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.file_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Message to client</Label>
                  <Textarea
                    placeholder="Add context or instructions for your client..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="mt-1.5"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !form.title}
                  className="w-full bg-zinc-900 hover:bg-zinc-800"
                >
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Send Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Feedback list */}
      {feedbackItems.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <ThumbsUp className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No feedback requests yet</p>
          {!isClient && (
            <p className="text-xs text-zinc-400 mt-1">
              Create a request to get approval or feedback from your client.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackItems.map((item) => {
            const conf = DECISION_CONFIG[item.decision] || DECISION_CONFIG.pending;
            const DecisionIcon = conf.icon;
            const isPending = item.decision === "pending";
            const isLoading = respondingId === item.id;

            return (
              <div key={item.id} className="bg-white border border-zinc-200 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-xs text-zinc-400">
                        {format(new Date(item.created_date), "MMM d, yyyy")}
                      </p>
                      {item.file_name && (
                        <span className="flex items-center gap-1 text-xs text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                          <Paperclip className="w-2.5 h-2.5" />
                          {item.file_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={`${conf.className} flex items-center gap-1.5 flex-shrink-0`}>
                    <DecisionIcon className="w-3 h-3" />
                    {conf.label}
                  </Badge>
                </div>

                {item.description && (
                  <p className="text-sm text-zinc-600 leading-relaxed mb-4 pb-4 border-b border-zinc-100">
                    {item.description}
                  </p>
                )}

                {/* Client response note */}
                {item.client_note && (
                  <div className="flex items-start gap-2 mb-4 p-3 bg-zinc-50 rounded-lg">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-0.5">
                        {item.client_name || "Client"} wrote:
                      </p>
                      <p className="text-sm text-zinc-700">{item.client_note}</p>
                    </div>
                  </div>
                )}

                {/* Client action buttons */}
                {isClient && isPending && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add a note (optional)..."
                      value={responseForm[item.id] || ""}
                      onChange={(e) =>
                        setResponseForm((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRespond(item, "approved")}
                        disabled={isLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRespond(item, "changes_requested")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Request Changes
                      </Button>
                    </div>
                  </div>
                )}

                {/* Filmmaker view of pending */}
                {!isClient && isPending && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    Waiting for client response
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}