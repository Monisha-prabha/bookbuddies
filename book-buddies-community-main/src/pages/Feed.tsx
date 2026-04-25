import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Bookmark,
  BookOpen,
  Image,
  Feather,
  BookMarked,
  Quote,
  X,
  Send,
  Trash2,
  Loader2,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// ── Post type config ──
const POST_TYPES = [
  { id: "thought", label: "Thought",    icon: BookOpen,   color: "text-blue-500",   bg: "bg-blue-500/10",   placeholder: "What's on your mind, bookworm? 📚" },
  { id: "snap",    label: "Snap",       icon: Image,      color: "text-pink-500",   bg: "bg-pink-500/10",   placeholder: "Share a snap from your reading corner... 📸" },
  { id: "poem",    label: "Poem",       icon: Feather,    color: "text-purple-500", bg: "bg-purple-500/10", placeholder: "Write your poem here... ✍️" },
  { id: "story",   label: "Story",      icon: BookMarked, color: "text-orange-500", bg: "bg-orange-500/10", placeholder: "Once upon a time... 📖" },
  { id: "quote",   label: "Book Quote", icon: Quote,      color: "text-green-500",  bg: "bg-green-500/10",  placeholder: "Share an inspiring book quote... 💬" },
];

const getTypeConfig = (type: string) =>
  POST_TYPES.find((t) => t.id === type) || POST_TYPES[0];

// ── Create Post Modal ──
function CreatePostModal({
  currentUserId,
  onClose,
  onPosted,
}: {
  currentUserId: string;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [selectedType, setSelectedType] = useState("thought");
  const [content, setContent] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const typeConfig = getTypeConfig(selectedType);
  const Icon = typeConfig.icon;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) { toast.error("Please write something!"); return; }
    setIsPosting(true);

    let imageUrl = null;
    if (selectedType === "snap" && imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `post-${currentUserId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("book-images")
        .upload(fileName, imageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("book-images")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("posts").insert({
      user_id: currentUserId,
      type: selectedType,
      content: content.trim(),
      image_url: imageUrl,
      book_title: bookTitle.trim() || null,
    });

    if (error) {
      toast.error("Failed to post: " + error.message);
    } else {
      toast.success("Posted successfully! 🎉");
      onPosted();
      onClose();
    }
    setIsPosting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-card rounded-3xl w-full max-w-lg shadow-card max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Create Post</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {/* Post Type Selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {POST_TYPES.map((type) => {
              const TIcon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                    selectedType === type.id
                      ? `${type.bg} ${type.color} border-current`
                      : "border-border text-muted-foreground hover:border-accent"
                  )}
                >
                  <TIcon className="w-3.5 h-3.5" />
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className={cn("rounded-2xl p-4", typeConfig.bg)}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={cn("w-4 h-4", typeConfig.color)} />
              <span className={cn("text-sm font-medium", typeConfig.color)}>
                {typeConfig.label}
              </span>
            </div>
            <textarea
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[120px] text-sm"
              placeholder={typeConfig.placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                fontFamily:
                  selectedType === "poem" || selectedType === "story"
                    ? "Georgia, serif"
                    : "inherit",
              }}
            />
          </div>

          {selectedType === "quote" && (
            <Input
              placeholder="Book title (optional)"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
            />
          )}

          {selectedType === "snap" && (
            <div>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full rounded-2xl object-cover max-h-48"
                  />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-6 cursor-pointer hover:border-accent transition-colors">
                  <Image className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload a photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>
          )}

          <Button
            variant="warm"
            className="w-full"
            onClick={handlePost}
            disabled={isPosting || !content.trim()}
          >
            {isPosting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isPosting ? "Posting..." : "Post"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Comments Section ──
function CommentsSection({
  postId,
  currentUserId,
  onClose,
}: {
  postId: string;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => { fetchComments(); }, [postId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select("*, profiles(full_name, username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    setIsPosting(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: currentUserId,
      content: newComment.trim(),
    });
    if (!error) { setNewComment(""); fetchComments(); }
    setIsPosting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("post_comments").delete().eq("id", commentId);
    fetchComments();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="bg-card rounded-3xl w-full max-w-lg shadow-card max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Comments ({comments.length})
          </h3>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-muted-foreground text-sm">
                No comments yet. Be the first!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <img
                  src={
                    comment.profiles?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full bg-muted shrink-0"
                />
                <div className="flex-1 bg-secondary rounded-2xl px-3 py-2">
                  <p className="text-xs font-medium text-foreground mb-0.5">
                    {comment.profiles?.full_name ||
                      comment.profiles?.username ||
                      "Reader"}
                  </p>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>

        {currentUserId && (
          <div className="p-4 border-t border-border flex gap-2">
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="warm"
              onClick={handleComment}
              disabled={isPosting || !newComment.trim()}
              className="rounded-full"
            >
              {isPosting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Post Card ──
function PostCard({
  post,
  currentUserId,
  onDelete,
}: {
  post: any;
  currentUserId: string | null;
  onDelete: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const typeConfig = getTypeConfig(post.type);
  const Icon = typeConfig.icon;

  useEffect(() => { fetchCounts(); }, [post.id]);

  const fetchCounts = async () => {
    const { count: lCount } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);
    setLikeCount(lCount || 0);

    const { count: cCount } = await supabase
      .from("post_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);
    setCommentCount(cCount || 0);

    if (currentUserId) {
      const { data: likeData } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .single();
      setIsLiked(!!likeData);

      const { data: saveData } = await supabase
        .from("post_saves")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .single();
      setIsSaved(!!saveData);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) { toast.error("Please login to like"); return; }
    setIsLiking(true);
    if (isLiked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId);
      setIsLiked(false);
      setLikeCount((p) => p - 1);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: currentUserId });
      setIsLiked(true);
      setLikeCount((p) => p + 1);
    }
    setIsLiking(false);
  };

  const handleSave = async () => {
    if (!currentUserId) { toast.error("Please login to save"); return; }
    if (isSaved) {
      await supabase
        .from("post_saves")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId);
      setIsSaved(false);
      toast.success("Removed from saved");
    } else {
      await supabase
        .from("post_saves")
        .insert({ post_id: post.id, user_id: currentUserId });
      setIsSaved(true);
      toast.success("Post saved! 🔖");
    }
  };

  const handleDelete = async () => {
  await supabase.from("posts").delete().eq("id", post.id);
  toast.success("Post deleted");
  onDelete();
};

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-soft overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src={
                post.profiles?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`
              }
              alt="avatar"
              className="w-10 h-10 rounded-full bg-muted"
            />
            <div>
              <p className="font-semibold text-foreground text-sm">
                {post.profiles?.full_name ||
                  post.profiles?.username ||
                  "Book Lover"}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs flex items-center gap-1 font-medium",
                    typeConfig.color
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {typeConfig.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  · {formatTime(post.created_at)}
                </span>
              </div>
            </div>
          </div>
          {currentUserId === post.user_id && (
            <button
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={cn("mx-4 rounded-2xl p-4 mb-3", typeConfig.bg)}>
          {post.type === "quote" && post.book_title && (
            <p
              className={cn(
                "text-xs font-medium mb-2 opacity-70",
                typeConfig.color
              )}
            >
              📖 {post.book_title}
            </p>
          )}
          <p
            className="text-foreground text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily:
                post.type === "poem" || post.type === "story"
                  ? "Georgia, serif"
                  : "inherit",
              fontStyle: post.type === "quote" ? "italic" : "normal",
            }}
          >
            {post.content}
          </p>
        </div>

        {/* Snap image */}
        {post.type === "snap" && post.image_url && (
          <div className="mx-4 mb-3 rounded-2xl overflow-hidden">
            <img
              src={post.image_url}
              alt="snap"
              className="w-full object-cover max-h-72"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-4 pb-4 pt-1">
          <div className="flex items-center gap-4">
            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              disabled={isLiking}
              className="flex items-center gap-1.5 group"
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isLiked
                      ? "text-red-500 fill-red-500"
                      : "text-muted-foreground group-hover:text-red-400"
                  )}
                />
              </motion.div>
              <span className="text-sm text-muted-foreground">{likeCount}</span>
            </motion.button>

            {/* Comment */}
            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-1.5 group"
            >
              <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="text-sm text-muted-foreground">{commentCount}</span>
            </button>

            
          </div>

          {/* Save */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleSave}>
            <Bookmark
              className={cn(
                "w-5 h-5 transition-colors",
                isSaved
                  ? "text-accent fill-accent"
                  : "text-muted-foreground hover:text-accent"
              )}
            />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showComments && (
          <CommentsSection
            postId={post.id}
            currentUserId={currentUserId}
            onClose={() => setShowComments(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Feed Page ──
export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    init();
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(full_name, username, avatar_url)")
      .order("created_at", { ascending: false });

    if (!error) {
      setPosts(data || []);
      setPostCount(data?.length || 0);
    }
    setIsLoading(false);
  };

  const filteredPosts =
    activeFilter === "all"
      ? posts
      : posts.filter((p) => p.type === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left: Feed ── */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4"
            >
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  📚 Reader's Feed
                </h1>
                <p className="text-muted-foreground mt-1">
                  Share your thoughts, poems, stories and more!
                </p>
              </div>
              <Button
                variant="warm"
                onClick={() => {
                  if (!currentUserId) {
                    toast.error("Please login to post");
                    return;
                  }
                  setShowCreateModal(true);
                }}
                className="rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Post
              </Button>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 overflow-x-auto pb-2 mb-6"
            >
              <button
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                  activeFilter === "all"
                    ? "bg-accent text-white border-accent"
                    : "border-border text-muted-foreground hover:border-accent"
                )}
              >
                All Posts
              </button>
              {POST_TYPES.map((type) => {
                const TIcon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveFilter(type.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                      activeFilter === type.id
                        ? `${type.bg} ${type.color} border-current`
                        : "border-border text-muted-foreground hover:border-accent"
                    )}
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </motion.div>

            {/* Posts */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-card rounded-2xl h-48 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-5xl mb-4">📖</p>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  No posts yet
                </h2>
                <p className="text-muted-foreground mb-6">
                  Be the first to share something!
                </p>
                <Button
                  variant="warm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onDelete={fetchPosts}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Sidebar ── */}
          <div className="lg:w-80 space-y-6 shrink-0">
            {/* Feed Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 shadow-card"
            >
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Feed Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Posts</span>
                  <span className="font-semibold text-foreground">
                    {postCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Post Types</span>
                  <span className="font-semibold text-foreground">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Filter</span>
                  <span className="font-semibold text-accent capitalize">
                    {activeFilter}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Post Types Guide */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 shadow-card"
            >
              <h3 className="font-semibold text-lg mb-4">
                What can you post?
              </h3>
              <div className="space-y-3">
                {POST_TYPES.map((type) => {
                  const TIcon = type.icon;
                  return (
                    <div key={type.id} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          type.bg
                        )}
                      >
                        <TIcon className={cn("w-4 h-4", type.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {type.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Create Post CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl p-6 shadow-card text-center"
            >
              <p className="text-3xl mb-3">✍️</p>
              <h3 className="font-semibold text-foreground mb-2">
                Share with readers
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Post your thoughts, poems, stories or quotes!
              </p>
              <Button
                variant="warm"
                className="w-full"
                onClick={() => {
                  if (!currentUserId) {
                    toast.error("Please login to post");
                    return;
                  }
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create a Post
              </Button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            currentUserId={currentUserId || ""}
            onClose={() => setShowCreateModal(false)}
            onPosted={fetchPosts}
          />
        )}
      </AnimatePresence>
    </div>
  );
}