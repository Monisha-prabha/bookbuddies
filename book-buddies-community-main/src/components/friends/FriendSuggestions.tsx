import { motion } from "framer-motion";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SuggestedProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export function FriendSuggestions() {
  const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }
      setCurrentUserId(user.id);
      await fetchSuggestions(user.id);
    };
    init();
  }, []);

  const fetchSuggestions = async (userId: string) => {
    setIsLoading(true);

    // Get already sent requests
    const { data: existing } = await supabase
      .from("friendships")
      .select("receiver_id")
      .eq("requester_id", userId);

    const alreadySent = new Set((existing || []).map((f) => f.receiver_id));
    setSentRequests(alreadySent);

    // Get other users excluding self and already sent
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .neq("id", userId)
      .limit(5);

    // Filter out already sent
    const filtered = (profiles || []).filter((p) => !alreadySent.has(p.id));
    setSuggestions(filtered.slice(0, 3));
    setIsLoading(false);
  };

  const handleAddFriend = async (receiverId: string) => {
    if (!currentUserId) { toast.error("Please login first"); return; }

    setLoadingIds((prev) => new Set([...prev, receiverId]));

    const { error } = await supabase.from("friendships").insert({
      requester_id: currentUserId,
      receiver_id: receiverId,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to send request");
    } else {
      setSentRequests((prev) => new Set([...prev, receiverId]));
      toast.success("Friend request sent! 🎉");
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(receiverId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <h3 className="font-semibold text-lg mb-4">Readers You May Like ✨</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <h3 className="font-semibold text-lg mb-4">Readers You May Like ✨</h3>
        <p className="text-sm text-muted-foreground text-center py-4">
          No new suggestions right now 📚
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <span className="text-gradient">Readers You May Like</span>
        ✨
      </h3>
      <div className="space-y-4">
        {suggestions.map((profile, index) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <img
              src={
                profile.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`
              }
              alt={profile.full_name || "Reader"}
              className="w-12 h-12 rounded-full bg-muted"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {profile.full_name || profile.username || "Book Lover"}
              </p>
              <p className="text-xs text-muted-foreground">
                @{profile.username || "reader"}
              </p>
            </div>
            <Button
              size="sm"
              variant={sentRequests.has(profile.id) ? "secondary" : "warm"}
              onClick={() => handleAddFriend(profile.id)}
              disabled={sentRequests.has(profile.id) || loadingIds.has(profile.id)}
              className="shrink-0"
            >
              {loadingIds.has(profile.id) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : sentRequests.has(profile.id) ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Sent</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Add</span>
                </>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}