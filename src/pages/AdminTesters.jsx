import React, { useState, useEffect } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, Trash2, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminTesters() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') window.location.href = '/Dashboard';
  }, [user]);

  const { data: pendingTesters = [], isLoading: loadingPending } = useQuery({
    queryKey: ["pending-testers"],
    queryFn: () => entities.PendingTester.list(),
    enabled: !!user,
  });

  const handleAddPending = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    await entities.PendingTester.create({ email: newEmail.trim().toLowerCase() });
    setNewEmail("");
    queryClient.invalidateQueries({ queryKey: ["pending-testers"] });
    toast({ title: "Added to pending testers list" });
  };

  const handleRemovePending = async (id) => {
    await entities.PendingTester.delete(id);
    queryClient.invalidateQueries({ queryKey: ["pending-testers"] });
  };

  const handlePromoteAll = async () => {
    setPromoting(true);
    try {
      const res = await invoke("promotePendingTesters", { manualTrigger: true });
      toast({ title: `Done — check console for details` });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setPromoting(false);
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Tester Management</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Add emails here before inviting users. Once they sign up, run "Promote All" to grant them tester access.
        </p>
      </div>

      {/* Add email form */}
      <form onSubmit={handleAddPending} className="flex gap-3">
        <Input
          type="email"
          placeholder="tester@email.com"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" className="bg-zinc-900 hover:bg-zinc-800 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Add Email
        </Button>
      </form>

      {/* Pending list */}
      <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800 text-sm">Pending Testers ({pendingTesters.length})</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePromoteAll}
            disabled={promoting || pendingTesters.length === 0}
            className="rounded-lg text-xs"
          >
            {promoting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Promote All Signed-Up
          </Button>
        </div>

        {loadingPending ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
          </div>
        ) : pendingTesters.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-400">No pending testers</div>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {pendingTesters.map(t => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-700">{t.email}</span>
                </div>
                <button
                  onClick={() => handleRemovePending(t.id)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 text-sm text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-700">Workflow:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Add their email above</li>
          <li>Invite them via <strong>Dashboard → Invite User</strong> (role: user)</li>
          <li>Once they sign up, click <strong>"Promote All Signed-Up"</strong></li>
        </ol>
      </div>
    </div>
  );
}