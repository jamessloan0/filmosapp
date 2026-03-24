import React, { useState, useEffect } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Loader2 } from "lucide-react";

const SETTINGS = [
  { key: "notify_on_message", label: "New client messages", description: "When the client sends a message" },
  { key: "notify_on_feedback", label: "Feedback responses", description: "When the client approves or requests changes" },
  { key: "notify_on_proposal", label: "Proposal responses", description: "When the client responds to a proposal" },
];

const DEFAULT_SETTINGS = {
  notify_on_message: true,
  notify_on_feedback: true,
  notify_on_proposal: true,
};

export default function NotificationSettingsPanel({ projectId, user }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState(DEFAULT_SETTINGS);
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ["notification-settings", projectId, user?.email],
    queryFn: () => entities.NotificationSettings.filter({ project_id: projectId, user_email: user?.email }),
    enabled: !!projectId && !!user?.email && open,
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setLocal({
        notify_on_message: s.notify_on_message !== false,
        notify_on_feedback: s.notify_on_feedback !== false,
        notify_on_proposal: s.notify_on_proposal !== false,
      });
    } else {
      setLocal(DEFAULT_SETTINGS);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const existing = settings[0];
    if (existing) {
      await entities.NotificationSettings.update(existing.id, local);
    } else {
      await entities.NotificationSettings.create({
        project_id: projectId,
        user_email: user?.email,
        ...local,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["notification-settings", projectId, user?.email] });
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg text-zinc-500 hover:text-zinc-700">
          <Bell className="w-3.5 h-3.5 mr-1.5" />
          Notifications
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500">Choose what sends you a notification for this project.</p>
        <div className="space-y-5 mt-2">
          {SETTINGS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-zinc-800">{label}</Label>
                <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
              </div>
              <Switch
                checked={local[key]}
                onCheckedChange={(val) => setLocal(prev => ({ ...prev, [key]: val }))}
              />
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Settings
        </Button>
      </DialogContent>
    </Dialog>
  );
}