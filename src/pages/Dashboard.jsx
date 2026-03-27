import React, { useEffect, useState } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, FolderOpen, Loader2, Archive, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import TutorialModal from "@/components/dashboard/TutorialModal";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/dashboard/ProjectCard";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import NotificationHub from "@/components/notifications/NotificationHub";

export default function Dashboard() {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("filmos_tutorial_seen");
    if (!seen) {
      setShowTutorial(true);
      localStorage.setItem("filmos_tutorial_seen", "1");
    }
  }, []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      toast({
        title: "🎉 Welcome to Pro!",
        description: "Your account has been upgraded. Enjoy unlimited projects!",
      });
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", user?.email],
    queryFn: () => entities.Project.filter({ owner_email: user.email }, "-updated_date"),
    enabled: !!user?.email,
  });

  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => !!p.archived);

  const isPro = user?.plan === 'pro' || user?.role === 'tester';

  const handleNewProject = () => {
    // Free tier: allow only 1 project
    if (!isPro && activeProjects.length >= 1) {
      setShowUpgrade(true);
      return;
    }
    window.location.href = createPageUrl("CreateProject");
  };

  const handleArchive = async (project) => {
    await entities.Project.update(project.id, { archived: true });
    queryClient.invalidateQueries({ queryKey: ["projects", user?.email] });
  };

  const handleRestore = async (project) => {
    await entities.Project.update(project.id, { archived: false });
    queryClient.invalidateQueries({ queryKey: ["projects", user?.email] });
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Permanently delete "${project.name}"? This cannot be undone.`)) return;
    await entities.Project.delete(project.id);
    queryClient.invalidateQueries({ queryKey: ["projects", user?.email] });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Projects</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {activeProjects.length} active project{activeProjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTutorial(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 hover:border-zinc-300 rounded-lg px-3 py-2 transition-colors bg-white"
            title="Help & Tutorial"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Help</span>
          </button>
          <NotificationHub user={user} />
          <Button
            onClick={handleNewProject}
            className="bg-zinc-900 hover:bg-zinc-800 rounded-xl h-10 px-5 shadow-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Free trial banner */}
      {!isPro && activeProjects.length >= 1 && (
        <div
          className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
          onClick={() => setShowUpgrade(true)}
        >
          <div>
            <p className="text-white font-semibold text-sm">You're on the free plan</p>
            <p className="text-zinc-400 text-xs mt-0.5">Upgrade to Pro for unlimited projects, clients & invoices.</p>
          </div>
          <Button
          size="sm"
          className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg font-semibold flex-shrink-0 self-start sm:self-auto"
          onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }}
          >
          Upgrade — $29/mo
          </Button>
        </div>
      )}

      {/* Active Projects */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-5 shadow-inner">
            <FolderOpen className="w-8 h-8 text-zinc-300" />
          </div>
          <h3 className="font-semibold text-zinc-700 text-lg mb-2">No projects yet</h3>
          <p className="text-sm text-zinc-400 mb-7 max-w-xs leading-relaxed">
            Create your first project to start collaborating with your client.
          </p>
          <Button
            onClick={handleNewProject}
            className="bg-zinc-900 hover:bg-zinc-800 rounded-xl h-10 px-6 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((s) => !s)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors mb-4 group"
          >
            <Archive className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
            Archived Projects ({archivedProjects.length})
            {showArchived ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} userEmail={user?.email} />
      <TutorialModal open={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}
