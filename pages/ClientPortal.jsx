import React, { useState, useEffect } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Film, Loader2, FileText, MessageSquare, Receipt, LayoutGrid, AlertTriangle, ThumbsUp, Presentation, PackageCheck, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import OverviewTab from "@/components/workspace/OverviewTab";
import FilesTab from "@/components/workspace/FilesTab";
import MessagesTab from "@/components/workspace/MessagesTab";
import InvoicesTab from "@/components/workspace/InvoicesTab";
import FeedbackTab from "@/components/workspace/FeedbackTab";
import ProposalTab from "@/components/workspace/ProposalTab";
import DeliverablesTab from "@/components/workspace/DeliverablesTab";
import NotificationBanner from "@/components/workspace/NotificationBanner";
import ClientTutorialModal from "@/components/dashboard/ClientTutorialModal";

export default function ClientPortal() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const queryClient = useQueryClient();

  const [clientName, setClientName] = useState("");
  const [enteredName, setEnteredName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const lsKey = `filmos_seen_messages_client_${token}`;
  const [seenMessageCount, setSeenMessageCount] = useState(() =>
    parseInt(localStorage.getItem(`filmos_seen_messages_client_${params.get("token")}`) || "0")
  );

  // Load saved client name
  useEffect(() => {
    const saved = localStorage.getItem(`filmos_client_${token}`);
    if (saved) {
      setClientName(saved);
      setEnteredName(true);
    }
  }, [token]);

  // Show tutorial on first visit (after name is set)
  useEffect(() => {
    if (!enteredName || !token) return;
    const tutorialKey = `filmos_client_tutorial_${token}`;
    if (!localStorage.getItem(tutorialKey)) {
      setShowTutorial(true);
      localStorage.setItem(tutorialKey, "1");
    }
  }, [enteredName, token]);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["client-project", token],
    queryFn: async () => {
      const res = await invoke('getProjectByToken', { token });
      return res.data?.project || null;
    },
    enabled: !!token,
  });

  const projectId = project?.id;

  const cpQuery = (type, key) => ({
    queryKey: [key, projectId],
    queryFn: async () => {
      const res = await invoke('getClientPortalData', { project_id: projectId, type });
      return res.data?.data || [];
    },
    enabled: !!projectId && enteredName,
  });

  const { data: files = [] } = useQuery(cpQuery('files', 'client-files'));
  const { data: messages = [] } = useQuery(cpQuery('messages', 'client-messages'));
  const { data: invoices = [] } = useQuery(cpQuery('invoices', 'client-invoices'));
  const { data: activities = [] } = useQuery(cpQuery('activities', 'client-activities'));
  const { data: feedbackItems = [] } = useQuery(cpQuery('feedback', 'client-feedback'));
  const { data: allProposals = [] } = useQuery(cpQuery('proposals', 'client-proposals'));
  const { data: deliverableFiles = [] } = useQuery(cpQuery('deliverables', 'client-deliverables'));
  const proposals = allProposals.filter(p => p.status !== 'draft');

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["client-files", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-messages", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-invoices", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-activities", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-feedback", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-proposals", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-deliverables", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-project", token] });
  };

  // Subscribe to message changes at page level
  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = entities.Message.subscribe((event) => {
      if (event.type === "create" && event.data?.project_id === projectId) {
        queryClient.setQueryData(["client-messages", projectId], (old) => {
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

  const handleEnterName = () => {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    setClientName(name);
    setEnteredName(true);
    localStorage.setItem(`filmos_client_${token}`, name);
    // Tutorial is now handled by the useEffect above
  };



  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Invalid or missing token
  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-sky-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Invalid Link</h1>
          <p className="text-sm text-zinc-500">This project link is not valid.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-sky-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Project Not Found</h1>
          <p className="text-sm text-zinc-500">This project link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  // Name entry screen
  if (!enteredName) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img
              src="https://media.base44.com/images/public/69b490115c68bd1fe6d609a8/19ed2b1d5_filmOSlogomain-removebg-preview.png"
              alt="FilmOS"
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-1">Welcome to {project.name}</h1>
          <p className="text-sm text-zinc-500 mb-6">Enter your name to access the project workspace.</p>

          <div className="space-y-4">
            <div className="text-left">
              <Label>Your Name</Label>
              <Input
                placeholder="e.g. Sarah Johnson"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnterName()}
                className="mt-1.5"
              />
            </div>
            <Button
              onClick={handleEnterName}
              disabled={!nameInput.trim()}
              className="w-full bg-zinc-900 hover:bg-zinc-800"
            >
              Enter Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Client header */}
      <header className="bg-white border-b border-zinc-200 px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69b490115c68bd1fe6d609a8/19ed2b1d5_filmOSlogomain-removebg-preview.png"
              alt="FilmOS"
              className="h-7 w-auto"
            />
            <div className="border-l border-zinc-200 pl-3">
              <h1 className="font-semibold text-zinc-900 text-sm">{project.name}</h1>
              <p className="text-xs text-zinc-400">Client Portal</p>
            </div>
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
            <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-600">
              {clientName[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-zinc-600 hidden sm:inline">{clientName}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Notifications */}
        <div className="space-y-2 mb-6">
          {notifications.map(notif => (
            <NotificationBanner
              key={notif.id}
              notification={notif}
              onDismiss={() => dismissNotification(notif.id)}
            />
          ))}
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={(tab) => { setCurrentTab(tab); if (tab === "messages") { setSeenMessageCount(messages.length); localStorage.setItem(lsKey, messages.length); } }}>
          <TabsList className="bg-zinc-100 p-1 mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Files</span>
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
              {proposals.filter(p => p.status === "sent").length > 0 && (
                <span className="ml-1 text-[10px] bg-sky-200 text-sky-700 px-1.5 py-0.5 rounded-full">
                  {proposals.filter(p => p.status === "sent").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="gap-2">
              <PackageCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deliverables</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              project={project}
              activities={activities}
              isClient={true}
            />
          </TabsContent>
          <TabsContent value="files">
            <FilesTab
              files={files}
              projectId={projectId}
              isClient={true}
              onFileUploaded={refreshAll}
            />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesTab
              messages={messages}
              projectId={projectId}
              senderName={clientName}
              senderType="client"
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
              isClient={true}
              onInvoiceCreated={refreshAll}
            />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackTab
              feedbackItems={feedbackItems}
              projectId={projectId}
              isClient={true}
              clientName={clientName}
              onUpdated={refreshAll}
              files={files}
            />
          </TabsContent>
          <TabsContent value="proposal">
            <ProposalTab
              proposals={proposals}
              projectId={projectId}
              isClient={true}
              clientName={clientName}
              onUpdated={refreshAll}
            />
          </TabsContent>
          <TabsContent value="deliverables">
            <DeliverablesTab
              projectId={projectId}
              authorName={clientName}
              authorType="client"
              isClient={true}
              files={deliverableFiles}
              onRefresh={refreshAll}
            />
          </TabsContent>
        </Tabs>
      </div>
      <ClientTutorialModal open={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}