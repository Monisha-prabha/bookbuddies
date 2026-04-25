import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Search, MoreVertical, Phone,
  ImageIcon, Paperclip, Smile, ArrowLeft,
  User, Trash2, ShieldOff, ShieldCheck, X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";
import { CallOverlay } from "@/components/chat/CallOverlay";

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isCommunity?: boolean;
  phone?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const PenWritingAnimation = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    className="flex justify-end mb-2"
  >
    <div className="flex items-center gap-2 bg-accent/10 rounded-2xl rounded-br-md px-4 py-2">
      <span className="text-xs text-accent font-medium">Sending</span>
      <div className="flex items-center gap-0.5">
        <motion.svg
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-accent"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </motion.svg>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent inline-block mx-0.5"
            animate={{ opacity: [0, 1, 0], scaleY: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

const BookStatusIcon = ({ isRead }: { isRead: boolean }) => (
  <motion.span
    key={isRead ? "open" : "closed"}
    initial={{ scale: 0.7, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 300 }}
    title={isRead ? "Seen" : "Not read yet"}
    className="ml-1 inline-flex items-center"
  >
    {isRead ? (
      <motion.svg width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className="text-white"
        initial={{ rotateY: 90 }} animate={{ rotateY: 0 }}
        transition={{ duration: 0.4 }}
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </motion.svg>
    ) : (
      <motion.svg width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className="text-white/50"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </motion.svg>
    )}
  </motion.span>
);

export default function Chat() {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSelectedBlocked = selectedChat ? blockedIds.has(selectedChat.id) : false;

  // ── WebRTC voice call ──
  const {
    callState,
    isMuted,
    incomingCaller,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
  } = useWebRTCCall({
    currentUserId,
    remoteUserId: selectedChat?.id ?? null,
    remoteUserName: selectedChat?.name ?? "",
    remoteUserAvatar: selectedChat?.avatar,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      fetchChatUsers(user.id);
      fetchBlockedIds(user.id);
    };
    getUser();
  }, []);

  const fetchBlockedIds = async (userId: string) => {
    const { data, error } = await supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", userId);

    if (!error && data) {
      setBlockedIds(new Set(data.map((r) => r.blocked_id)));
    }
  };

  const fetchChatUsers = async (userId: string) => {
    setIsLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, phone")
      .neq("id", userId);

    if (error) { toast.error("Failed to load chats"); setIsLoading(false); return; }

    const users: ChatUser[] = (profiles || []).map((p) => ({
      id: p.id,
      name: p.full_name || p.username || "Book Buddy",
      avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
      lastMessage: "Start a conversation!",
      time: "",
      unread: 0,
      isOnline: false,
      phone: p.phone || "",
    }));

    setChatUsers(users);
    if (users.length > 0 && window.innerWidth >= 768) {
      setSelectedChat(users[0]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!selectedChat || !currentUserId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      if (!error) setMessages(data || []);

      await supabase.from("messages").update({ is_read: true })
        .eq("sender_id", selectedChat.id)
        .eq("receiver_id", currentUserId)
        .eq("is_read", false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${currentUserId}-${selectedChat.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `receiver_id=eq.${currentUserId}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (blockedIds.has(newMsg.sender_id)) return;
        if (newMsg.sender_id === selectedChat.id || newMsg.receiver_id === selectedChat.id) {
          setMessages((prev) => [...prev, newMsg]);
          supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedChat, currentUserId, blockedIds]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
  };

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !currentUserId || !selectedChat) return;
    setNewMessage("");
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const { data, error } = await supabase.from("messages")
      .insert({ sender_id: currentUserId, receiver_id: selectedChat.id, content: text, is_read: false })
      .select().single();

    if (error) toast.error("Failed to send message");
    else if (data) setMessages((prev) => [...prev, data]);
  };

  // ── Phone call — now uses WebRTC ──
  const handlePhoneCall = () => {
    if (isSelectedBlocked) {
      toast.error("Unblock this user to call them");
      return;
    }
    startCall();
  };

  // ── View profile ──
  const handleViewProfile = () => {
    setShowDropdown(false);
    if (selectedChat) navigate(`/profile?id=${selectedChat.id}`);
  };

  // ── Clear chat ──
  const handleClearChat = async () => {
    if (!currentUserId || !selectedChat) return;
    setShowClearConfirm(false);
    setShowDropdown(false);

    const { error } = await supabase
      .from("messages")
      .delete()
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUserId})`);

    if (error) {
      toast.error("Failed to clear chat");
    } else {
      setMessages([]);
      toast.success("Chat cleared");
    }
  };

  // ── Block user ──
  const handleBlock = async () => {
    if (!currentUserId || !selectedChat) return;
    setShowBlockConfirm(false);
    setShowDropdown(false);

    const { error } = await supabase
      .from("blocked_users")
      .insert({ blocker_id: currentUserId, blocked_id: selectedChat.id });

    if (error) {
      toast.error("Failed to block user");
    } else {
      setBlockedIds((prev) => new Set([...prev, selectedChat.id]));
      toast.success(`${selectedChat.name} has been blocked`);
    }
  };

  // ── Unblock user ──
  const handleUnblock = async () => {
    if (!currentUserId || !selectedChat) return;
    setShowDropdown(false);

    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("blocker_id", currentUserId)
      .eq("blocked_id", selectedChat.id);

    if (error) {
      toast.error("Failed to unblock user");
    } else {
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedChat.id);
        return next;
      });
      toast.success(`${selectedChat.name} has been unblocked`);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredChats = chatUsers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectChat = (chat: ChatUser) => {
    setSelectedChat(chat);
    setShowChatOnMobile(true);
    setShowDropdown(false);
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setSelectedChat(null);
    setShowDropdown(false);
  };

  return (
    <div className="flex flex-col md:h-screen" style={{ height: "calc(100dvh - 64px)" }}>

      <Navbar />

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── CONTACTS SIDEBAR ── */}
        <div className={cn(
          "flex-col border-r border-border bg-card flex-shrink-0 h-full",
          "w-full md:w-80",
          showChatOnMobile ? "hidden" : "flex",
          "md:flex",
        )}>
          <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                className="pl-10 bg-secondary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors",
                    selectedChat?.id === chat.id && "bg-secondary"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full bg-muted" />
                    {blockedIds.has(chat.id) && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                        <ShieldOff className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className={cn("font-medium truncate", blockedIds.has(chat.id) ? "text-muted-foreground" : "text-foreground")}>
                        {chat.name}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {blockedIds.has(chat.id) ? "Blocked" : chat.lastMessage}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── CHAT WINDOW ── */}
        <div className={cn(
          "flex-col bg-card flex-1 h-full overflow-hidden",
          showChatOnMobile ? "flex" : "hidden",
          "md:flex",
        )}>
          {selectedChat ? (
            <div className="flex flex-col h-full overflow-hidden">

              {/* HEADER */}
              <div className="flex-shrink-0 px-3 py-3 sm:px-4 border-b border-border flex items-center justify-between gap-2 bg-card z-10">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={handleBackToList}
                    className="md:hidden flex-shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="relative flex-shrink-0">
                    <img
                      src={selectedChat.avatar}
                      alt={selectedChat.name}
                      className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted", isSelectedBlocked && "opacity-50")}
                    />
                    {isSelectedBlocked && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                        <ShieldOff className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate text-sm sm:text-base">
                      {selectedChat.name}
                    </p>
                    <p className={cn("text-xs", isSelectedBlocked ? "text-destructive font-medium" : "text-muted-foreground")}>
                      {isSelectedBlocked ? "Blocked" : "Book Buddy"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Phone button → triggers WebRTC call */}
                  <Button
                    size="icon" variant="ghost"
                    className="w-8 h-8 sm:w-10 sm:h-10"
                    onClick={handlePhoneCall}
                    disabled={callState !== "idle"}
                    title={isSelectedBlocked ? "Unblock to call" : `Call ${selectedChat.name}`}
                  >
                    <Phone className={cn(
                      "w-4 h-4",
                      isSelectedBlocked
                        ? "text-muted-foreground"
                        : callState !== "idle"
                        ? "text-green-500 animate-pulse"
                        : "text-accent"
                    )} />
                  </Button>

                  <div className="relative" ref={dropdownRef}>
                    <Button
                      size="icon" variant="ghost"
                      className="w-8 h-8 sm:w-10 sm:h-10"
                      onClick={() => setShowDropdown((v) => !v)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-10 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                        >
                          <button
                            onClick={handleViewProfile}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            View Profile
                          </button>
                          <button
                            onClick={() => { setShowDropdown(false); setShowClearConfirm(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                            Clear Chat
                          </button>
                          {isSelectedBlocked ? (
                            <button
                              onClick={handleUnblock}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Unblock User
                            </button>
                          ) : (
                            <button
                              onClick={() => { setShowDropdown(false); setShowBlockConfirm(true); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <ShieldOff className="w-4 h-4" />
                              Block User
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* MESSAGES or BLOCKED BANNER */}
              {isSelectedBlocked ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldOff className="w-8 h-8 text-destructive" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">You blocked {selectedChat.name}</p>
                    <p className="text-sm text-muted-foreground mb-4">You won't receive messages from this person.</p>
                    <Button variant="outline" size="sm" onClick={handleUnblock}>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Unblock
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-2">📚</p>
                      <p className="text-muted-foreground text-sm">Start a conversation about books!</p>
                    </div>
                  )}
                  {messages.map((message, index) => {
                    const isMe = message.sender_id === currentUserId;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn("flex", isMe ? "justify-end" : "justify-start")}
                      >
                        <div className={cn(
                          "max-w-[80%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2",
                          isMe
                            ? "gradient-warm text-white rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        )}>
                          <p className="text-sm break-words">{message.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 text-xs mt-1",
                            isMe ? "text-white/70 justify-end" : "text-muted-foreground"
                          )}>
                            <span>{formatTime(message.created_at)}</span>
                            {isMe && <BookStatusIcon isRead={message.is_read} />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <AnimatePresence>
                    {isTyping && newMessage.trim().length > 0 && <PenWritingAnimation />}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* INPUT BAR */}
              {!isSelectedBlocked && (
                <div className="flex-shrink-0 p-2 sm:p-4 border-t border-border bg-card">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button size="icon" variant="ghost" className="hidden sm:flex flex-shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="hidden sm:flex flex-shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="pr-10 text-sm"
                      />
                      <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                        <Smile className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="warm"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="rounded-full flex-shrink-0"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl mb-4">📚</p>
                <p className="text-muted-foreground">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CLEAR CHAT CONFIRM ── */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-lg">Clear Chat</h3>
                <button onClick={() => setShowClearConfirm(false)} className="p-1 rounded-lg hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                All messages with <span className="font-medium text-foreground">{selectedChat?.name}</span> will be permanently deleted. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleClearChat}>Clear</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BLOCK CONFIRM ── */}
      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setShowBlockConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-lg">Block User</h3>
                <button onClick={() => setShowBlockConfirm(false)} className="p-1 rounded-lg hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Block <span className="font-medium text-foreground">{selectedChat?.name}</span>? They won't be able to send you messages and you won't see their messages.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowBlockConfirm(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleBlock}>Block</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CALL OVERLAY (Instagram-style, z-200) ── */}
      <CallOverlay
        callState={callState}
        isMuted={isMuted}
        remoteUserName={selectedChat?.name ?? ""}
        remoteUserAvatar={selectedChat?.avatar}
        incomingCaller={incomingCaller}
        onAccept={acceptCall}
        onDecline={declineCall}
        onHangUp={hangUp}
        onToggleMute={toggleMute}
      />

    </div>
  );
}