import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  MessageCircle,
  Crown,
  ChevronRight,
  X,
  Loader2,
  Send,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface Community {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_by: string;
  isMember?: boolean;
  isAdmin?: boolean;
  memberCount?: number;
}

export default function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Community chat state
  const [openCommunity, setOpenCommunity] = useState<Community | null>(null);
  const [communityMessages, setCommunityMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchCommunities(user.id);
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [communityMessages]);

  const fetchCommunities = async (userId: string) => {
    setIsLoading(true);

    const { data: allCommunities, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { toast.error("Failed to load communities"); setIsLoading(false); return; }

    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId);

    const joinedIds = new Set((memberships || []).map((m) => m.community_id));

    const { data: memberCounts } = await supabase
      .from("community_members")
      .select("community_id");

    const countMap: Record<string, number> = {};
    (memberCounts || []).forEach((m) => {
      countMap[m.community_id] = (countMap[m.community_id] || 0) + 1;
    });

    const enriched: Community[] = (allCommunities || []).map((c) => ({
      ...c,
      isMember: joinedIds.has(c.id),
      isAdmin: c.created_by === userId,
      memberCount: countMap[c.id] || 0,
    }));

    setCommunities(enriched);
    setIsLoading(false);
  };

  const handleJoin = async (communityId: string) => {
    if (!currentUserId) { toast.error("Please login first"); return; }

    const { error } = await supabase.from("community_members").insert({
      community_id: communityId,
      user_id: currentUserId,
    });

    if (error) {
      toast.error("Failed to join community");
    } else {
      toast.success("Joined community! 🎉");
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, isMember: true, memberCount: (c.memberCount || 0) + 1 }
            : c
        )
      );
    }
  };

  const handleLeave = async (communityId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", currentUserId);

    if (error) {
      toast.error("Failed to leave community");
    } else {
      toast.success("Left community");
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, isMember: false, memberCount: Math.max(0, (c.memberCount || 1) - 1) }
            : c
        )
      );
    }
  };

  const handleCreateCommunity = async () => {
    if (!newName.trim()) { toast.error("Please enter a community name"); return; }
    if (!currentUserId) { toast.error("Please login first"); return; }

    setIsCreating(true);

    const { data, error } = await supabase
      .from("communities")
      .insert({
        name: newName.trim(),
        description: newDescription.trim(),
        created_by: currentUserId,
        image_url: null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create community");
    } else {
      await supabase.from("community_members").insert({
        community_id: data.id,
        user_id: currentUserId,
      });
      toast.success("Community created! 🎉");
      setShowCreateModal(false);
      setNewName("");
      setNewDescription("");
      fetchCommunities(currentUserId);
    }

    setIsCreating(false);
  };

  const handleOpenCommunity = async (community: Community) => {
    setOpenCommunity(community);
    setIsLoadingMessages(true);
    setCommunityMessages([]);

    const { data } = await supabase
      .from("community_messages")
      .select("*, profiles(full_name, username, avatar_url)")
      .eq("community_id", community.id)
      .order("created_at", { ascending: true });

    setCommunityMessages(data || []);
    setIsLoadingMessages(false);
  };
  

 const handleSendCommunityMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !openCommunity) return;
    setIsSendingMessage(true);

    const { error } = await supabase.from("community_messages").insert({
      sender_id: currentUserId,
      community_id: openCommunity.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      await handleOpenCommunity(openCommunity);
    } else {
      toast.error("Failed to send message");
      console.error(error);
    }

    setIsSendingMessage(false);
  };


  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myCommunities = filteredCommunities.filter((c) => c.isMember);
  const discoverCommunities = filteredCommunities.filter((c) => !c.isMember);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-accent" />
            Book Communities
          </h1>
          <p className="text-muted-foreground">
            Join communities centered around your favorite books
          </p>
        </motion.div>

        {/* Search & Create */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <Button variant="warm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Community
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Your Communities */}
            {myCommunities.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Your Communities
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myCommunities.map((community, index) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      index={index}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      onOpen={handleOpenCommunity}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Discover Communities */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Discover Communities
              </h2>
              {discoverCommunities.length === 0 && myCommunities.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-4">👥</p>
                  <p className="text-xl font-semibold text-foreground mb-2">
                    No communities yet
                  </p>
                  <p className="text-muted-foreground mb-6">
                    Be the first to create one!
                  </p>
                  <Button variant="warm" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Community
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discoverCommunities.map((community, index) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      index={index}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      onOpen={handleOpenCommunity}
                    />
                  ))}
                </div>
              )}
            </motion.section>
          </>
        )}
      </main>

      {/* ── Create Community Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-3xl p-8 w-full max-w-md shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Create Community
                </h2>
                <Button size="icon" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Community Name
                  </label>
                  <Input
                    placeholder="e.g. Harry Potter Fans"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Description
                  </label>
                  <textarea
                    placeholder="What is this community about?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm min-h-[100px] bg-background resize-none"
                  />
                </div>

                <Button
                  variant="warm"
                  className="w-full"
                  onClick={handleCreateCommunity}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Community 🎉"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Community Chat Modal ── */}
      <AnimatePresence>
        {openCommunity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setOpenCommunity(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-3xl w-full max-w-lg shadow-card flex flex-col overflow-hidden"
              style={{ height: "80vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-5 border-b border-border shrink-0">
                <div className="w-10 h-10 rounded-full gradient-warm flex items-center justify-center shrink-0 overflow-hidden">
                  {openCommunity.image_url ? (
                    <img
                      src={openCommunity.image_url}
                      alt={openCommunity.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-foreground truncate">
                    {openCommunity.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    👥 {openCommunity.memberCount} members
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setOpenCommunity(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  </div>
                ) : communityMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-4xl mb-3">💬</p>
                    <p className="font-semibold text-foreground mb-1">
                      No messages yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Be the first to say something!
                    </p>
                  </div>
                ) : (
                  <>
                    {communityMessages.map((msg) => {
                      const isMe = msg.sender_id === currentUserId;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <img
                            src={
                              msg.profiles?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`
                            }
                            alt="avatar"
                            className="w-8 h-8 rounded-full bg-muted shrink-0 self-end"
                          />
                          <div
                            className={`flex flex-col max-w-[70%] ${
                              isMe ? "items-end" : "items-start"
                            }`}
                          >
                            {!isMe && (
                              <p className="text-xs text-muted-foreground mb-1 ml-1">
                                {msg.profiles?.full_name ||
                                  msg.profiles?.username ||
                                  "Member"}
                              </p>
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                                isMe
                                  ? "gradient-warm text-white rounded-br-sm"
                                  : "bg-secondary text-foreground rounded-bl-sm"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 mx-1">
                              {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border flex gap-2 shrink-0">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendCommunityMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="warm"
                  onClick={handleSendCommunityMessage}
                  disabled={isSendingMessage || !newMessage.trim()}
                  className="rounded-full shrink-0"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Community Card ──
function CommunityCard({
  community,
  index,
  onJoin,
  onLeave,
  onOpen,
}: {
  community: Community;
  index: number;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onOpen: (community: Community) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all group"
    >
      {/* Cover */}
      <div className="relative h-32">
        {community.image_url ? (
          <img
            src={community.image_url}
            alt={community.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full gradient-warm flex items-center justify-center">
            <Users className="w-12 h-12 text-white/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {community.isAdmin && (
            <Badge className="bg-accent text-white border-0">
              <Crown className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
          {community.isMember && !community.isAdmin && (
            <Badge className="bg-white/20 text-white border-0">Member</Badge>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
          {community.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {community.description || "A community for book lovers"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            👥 {community.memberCount || 0} members
          </span>

          {community.isMember ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpen(community)}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Open
              </Button>
              {!community.isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onLeave(community.id)}
                >
                  Leave
                </Button>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant="warm"
              onClick={() => onJoin(community.id)}
            >
              Join
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}