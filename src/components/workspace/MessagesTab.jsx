import React, { useState, useRef, useEffect } from "react";
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare } from "lucide-react";

export default function MessagesTab({ messages, projectId, senderName, senderType, onMessageSent, onNewMessage }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [liveMessages, setLiveMessages] = useState(messages);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLiveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!projectId) return;
    
    const unsubscribe = entities.Message.subscribe((event) => {
      if (event.type === "create" && event.data?.project_id === projectId) {
        setLiveMessages(prev => {
          const exists = prev.some(m => m.id === event.data.id);
          return exists ? prev : [...prev, event.data];
        });
      }
    });
    return unsubscribe;
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveMessages]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);

    await entities.Message.create({
      project_id: projectId,
      sender_name: senderName,
      sender_type: senderType,
      content: content.trim(),
    });

    await entities.Activity.create({
      project_id: projectId,
      type: "message",
      description: `${senderName} sent a message`,
      actor_name: senderName,
    });

    setContent("");
    setSending(false);
    onMessageSent();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 messages-scroll">
        {liveMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-zinc-200 mb-3" />
            <p className="text-sm text-zinc-400">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          liveMessages.map((msg) => {
            const isMe = msg.sender_type === senderType;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] ${isMe ? "order-2" : ""}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? "justify-end" : ""}`}>
                    <span className="text-xs font-medium text-zinc-500">{msg.sender_name}</span>
                    <span className="text-xs text-zinc-300">
                      {format(new Date(msg.created_date), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-zinc-900 text-white rounded-br-md"
                        : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-100 p-4">
        <div className="flex gap-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className="bg-zinc-900 hover:bg-zinc-800 px-4 self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}