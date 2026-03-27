import React, { useState, useEffect } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FolderPlus, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import UpgradeModal from "@/components/dashboard/UpgradeModal";

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", client_email: "", client_name: "" });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const existing = await entities.Project.filter({ owner_email: user.email });
      const active = existing.filter((p) => !p.archived);
      if (active.length >= 1 && user.plan !== 'pro') {
        setShowUpgrade(true);
      }
    })();
  }, [user]);

  const handleCreate = async () => {
    if (!form.name || !form.client_email) return;
    setCreating(true);

    const token = generateToken();
    const project = await entities.Project.create({
      name: form.name,
      client_email: form.client_email,
      client_name: form.client_name || form.client_email.split("@")[0],
      status: "proposal",
      access_token: token,
      owner_email: user.email,
    });

    await entities.Activity.create({
      project_id: project.id,
      type: "status_change",
      description: "Project created",
      actor_name: user.full_name || user.email,
    });
    console.log("owner_email: " + owner_email);
    console.log("user.email: " + user.email);
    setCreated(project);
    setCreating(false);
  };

  const clientLink = created
    ? `${window.location.origin}${createPageUrl("ClientPortal")}?token=${created.access_token}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(clientLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        to={createPageUrl("Dashboard")}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      {!created ? (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">New Project</h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              Set up a workspace to collaborate with your client.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <Label className="text-zinc-600 text-xs font-semibold uppercase tracking-wide">Project Name</Label>
              <Input
                placeholder="e.g. Wedding Film — Sarah & John"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 rounded-xl border-zinc-200 h-11"
              />
            </div>
            <div>
              <Label className="text-zinc-600 text-xs font-semibold uppercase tracking-wide">Client Name</Label>
              <Input
                placeholder="e.g. Sarah Johnson"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="mt-2 rounded-xl border-zinc-200 h-11"
              />
            </div>
            <div>
              <Label className="text-zinc-600 text-xs font-semibold uppercase tracking-wide">Client Email</Label>
              <Input
                type="email"
                placeholder="client@example.com"
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                className="mt-2 rounded-xl border-zinc-200 h-11"
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating || !form.name || !form.client_email}
              className="w-full bg-zinc-900 hover:bg-zinc-800 h-11 rounded-xl font-semibold mt-2"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4 mr-2" />
              )}
              Create Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Project Created!</h2>
          <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
            Share this link with your client so they can access the project workspace.
          </p>

          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 flex items-center gap-2 mb-6">
            <input
              readOnly
              value={clientLink}
              className="flex-1 bg-transparent text-sm text-zinc-600 outline-none truncate"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-shrink-0 rounded-lg"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>

          <div className="flex gap-3">
            <Link to={createPageUrl("Dashboard")} className="flex-1">
              <Button variant="outline" className="w-full rounded-xl h-10">Dashboard</Button>
            </Link>
            <Link to={createPageUrl("ProjectWorkspace") + `?id=${created.id}`} className="flex-1">
              <Button className="w-full bg-zinc-900 hover:bg-zinc-800 rounded-xl h-10">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Project
              </Button>
            </Link>
          </div>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => { setShowUpgrade(false); navigate(createPageUrl("Dashboard")); }} />
    </div>
  );
}
