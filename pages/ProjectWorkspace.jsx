import React, { useState, useEffect } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Copy, Check, LayoutGrid, FileText, MessageSquare, Receipt, ThumbsUp, Presentation, Archive, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

import OverviewTab from "@/components/workspace/OverviewTab";
import FilesTab from "@/components/workspace/FilesTab";
import MessagesTab from "@/components/workspace/MessagesTab";
import InvoicesTab from "@/components/workspace/InvoicesTab";
import FeedbackTab from "@/components/workspace/FeedbackTab";
import ProposalTab from "@/components/workspace/ProposalTab";
import DeliverablesTab from "@/components/workspace/DeliverablesTab";
import NotificationBanner from "@/components/workspace/NotificationBanner";
import NotificationSettingsPanel from "@/components/notifications/NotificationSettingsPanel";
import ErrorBoundary from "@/lib/ErrorBoundary";
import UpgradeModal from "@/components/dashboard/UpgradeModal";

export default function ProjectWorkspace() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const lsKey = `filmos_seen_messages_${projectId}`;
  const [seenMessageCount, setSeenMessageCount] = useState(() =>
    parseInt(localStorage.getItem(`filmos_seen_messages_${params.get("id")}`) || "0")
  );

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const projects = await entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  const { data: files = [] } = useQuery({
    queryKey: ["files", projectId],
    queryFn: () => entities.ProjectFile.filter({ project_id: projectId }, "-created_date"),
    enabled: !!projectId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", projectId],
    queryFn: () => entities.Message.filter({ project_id: projectId }, "created_date"),
    enabled: !!projectId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", projectId],
    queryFn: () => entities.Invoice.filter({ project_id: projectId }, "-created_date"),
    enabled: !!projectId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", projectId],
    queryFn: () => entities.Activity.filter({ project_id: projectId }, "-created_date"),
    enabled: !!projectId,
  });

  const { data: feedbackItems = [] } = useQuery({
    queryKey: ["feedback", projectId],
    queryFn: () => entities.Feedback.filter({ project_id: projectId }, "-created_date"),
    enabled: !!projectId,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals", projectId],
    queryFn: () => entities.Proposal.filter({ project_id: projectId }, "-created_date"),
    enabled: !!projectId,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["files", projectId] });
    queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
    queryClient.invalidateQueries({ queryKey: ["invoices", projectId] });
    queryClient.invalidateQueries({ queryKey: ["activities", projectId] });
    queryClient.invalidateQueries({ queryKey: ["feedback", projectId] });
    queryClient.invalidateQueries({ queryKey: ["proposals", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  // Subscribe to message changes at page level
  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = entities.Message.subscribe((event) => {
      if (event.type === "create" && event.data?.project_id === projectId) {
        queryClient.setQueryData(["messages", projectId], (old) => {
          if (!old) return [event.data];
          return old.some(m => m.id === event.data.id) ? old : [...old, event.data];
        });
        if (currentTab === "messages") {
          setSeenMessageCount(prev => { const next = prev + 1; localStorage.setItem(lsKey, next); return next; });
        } else {
          setNotifications([{
            id: event.data.id,
            senderName: event.data.sender_name,
            content: event.data.content
          }]);
        }
      }
    });
    return unsubscribe;
  }, [projectId, queryClient, currentTab]);

  const handleArchive = async () => {
    if (!window.confirm("Archive this project? It will be moved to the archived section.")) return;
    await entities.Project.update(project.id, { archived: true });
    window.location.href = createPageUrl("Dashboard");
  };

  const handleStatusChange = async (newStatus) => {
    await entities.Project.update(project.id, { status: newStatus });
    await entities.Activity.create({
      project_id: projectId,
      type: "status_change",
      description: `Status changed to ${newStatus.replace("_", " ")}`,
      actor_name: user?.full_name || user?.email || "Filmmaker",
    });
    refreshAll();
  };

  const clientLink = project
    ? `${window.location.origin}${createPageUrl("ClientPortal")}?token=${project.access_token}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };



  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loadingProject || !project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to={createPageUrl("Dashboard")}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Projects
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2 self-start">
          <NotificationSettingsPanel projectId={projectId} user={user} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            className="rounded-lg text-zinc-500 hover:text-zinc-700"
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="rounded-lg"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-2" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
            {copied ? "Copied!" : "Copy Client Link"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map(notif => (
          <NotificationBanner
            key={notif.id}
            notification={notif}
            onDismiss={() => dismissNotification(notif.id)}
          />
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={(tab) => { setCurrentTab(tab); if (tab === "messages") { setSeenMessageCount(messages.length); localStorage.setItem(lsKey, messages.length); } }}>
        <div className="overflow-x-auto pb-1">
        <TabsList className="bg-white border border-zinc-100 shadow-sm p-1 mb-8 rounded-xl w-max min-w-full">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Files</span>
            {files.length > 0 && (
              <span className="ml-1 text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full">
                {files.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Messages</span>
            {messages.length - seenMessageCount > 0 && (
              <span className="ml-1 text-[10px] bg-sky-200 text-sky-700 px-1.5 py-0.5 rounded-full">
                {messages.length - seenMessageCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invoices</span>
            {invoices.length > 0 && (
              <span className="ml-1 text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full">
                {invoices.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Feedback</span>
            {feedbackItems.filter(f => f.decision === "pending").length > 0 && (
              <span className="ml-1 text-[10px] bg-sky-200 text-sky-700 px-1.5 py-0.5 rounded-full">
                {feedbackItems.filter(f => f.decision === "pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="proposal" className="gap-2">
            <Presentation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Proposal</span>
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-2">
            <PackageCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deliverables</span>
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="overview">
          <ErrorBoundary>
          <OverviewTab
            project={project}
            activities={activities}
            onStatusChange={handleStatusChange}
            isClient={false}
          />
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="files">
          <ErrorBoundary>
          <FilesTab
            files={files}
            projectId={projectId}
            isClient={false}
            onFileUploaded={refreshAll}
          />
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="messages">
          <MessagesTab
            messages={messages}
            projectId={projectId}
            senderName={user?.full_name || user?.email || "Filmmaker"}
            senderType="filmmaker"
            onMessageSent={refreshAll}
          />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab
            invoices={invoices}
            projectId={projectId}
            projectName={project.name}
            clientName={project.client_name}
            clientEmail={project.client_email}
            isClient={false}
            onInvoiceCreated={refreshAll}
            filmmakerName={user?.full_name || user?.email}
            filmmakerEmail={user?.email}
            isPro={user?.plan === 'pro' || user?.role === 'tester'}
            onUpgrade={() => setShowUpgrade(true)}
          />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackTab
            feedbackItems={feedbackItems}
            projectId={projectId}
            isClient={false}
            onUpdated={refreshAll}
            files={files}
          />
        </TabsContent>
        <TabsContent value="proposal">
          <ProposalTab
            proposals={proposals}
            projectId={projectId}
            isClient={false}
            onUpdated={refreshAll}
          />
        </TabsContent>
        <TabsContent value="deliverables">
          <ErrorBoundary>
          <DeliverablesTab
            projectId={projectId}
            authorName={user?.full_name || user?.email || "Filmmaker"}
            authorType="filmmaker"
            isClient={false}
            isPro={user?.plan === 'pro' || user?.role === 'tester'}
          />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} userEmail={user?.email} />
    </div>
  );
}