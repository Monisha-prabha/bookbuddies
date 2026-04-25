import { useNavigate, useLocation } from "react-router-dom"; // add useLocation
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Book,
  ShoppingBag,
  Users,
  Edit,
  Camera,
  Settings,
  LogOut,
  ChevronRight,
  Bookmark,
  UserCheck,
  UserX,
  Clock,
  Trash2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export default function Profile() {
  
  const [profile, setProfile] = useState<any>(null);
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
  (location.state as any)?.tab || "books"
);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setCurrentUserId(user.id);
      fetchProfile(user.id);
      fetchMyBooks(user.id);
      fetchMyOrders(user.id);
      fetchMyCommunities(user.id);
      fetchSavedPosts(user.id);
      fetchFriends(user.id);
    };
    init();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
    setIsLoading(false);
  };

  const fetchMyBooks = async (userId: string) => {
    const { data } = await supabase
      .from("books")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    setMyBooks(data || []);
  };

  const fetchMyOrders = async (userId: string) => {
    const { data } = await supabase
      .from("orders")
      .select("*, books(title, author, image_url, price)")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });
    setMyOrders(data || []);
  };

  const fetchMyCommunities = async (userId: string) => {
    const { data } = await supabase
      .from("community_members")
      .select("*, communities(id, name)")
      .eq("user_id", userId);
    setMyCommunities(data || []);
  };

  const fetchSavedPosts = async (userId: string) => {
    const { data } = await supabase
      .from("post_saves")
      .select("*, posts(id, type, content, image_url, book_title, created_at, user_id, profiles(full_name, username, avatar_url))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setSavedPosts(data || []);
  };

  const fetchFriends = async (userId: string) => {
    // Accepted friends
    const { data: accepted } = await supabase
      .from("friendships")
      .select("*, requester:requester_id(id, full_name, username, avatar_url), receiver:receiver_id(id, full_name, username, avatar_url)")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    setFriends(accepted || []);

    // Pending requests received (others sent to me)
    const { data: received } = await supabase
      .from("friendships")
      .select("*, requester:requester_id(id, full_name, username, avatar_url)")
      .eq("receiver_id", userId)
      .eq("status", "pending");
    setPendingReceived(received || []);

    // Pending requests sent by me
    const { data: sent } = await supabase
      .from("friendships")
      .select("*, receiver:receiver_id(id, full_name, username, avatar_url)")
      .eq("requester_id", userId)
      .eq("status", "pending");
    setPendingSent(sent || []);
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (!error) {
      toast.success("Friend request accepted! 🎉");
      fetchFriends(currentUserId!);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    if (!error) {
      toast.success("Request declined");
      fetchFriends(currentUserId!);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    if (!error) {
      toast.success("Friend removed");
      fetchFriends(currentUserId!);
    }
  };

  const handleUnsavePost = async (postSaveId: string) => {
    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("id", postSaveId);
    if (!error) {
      setSavedPosts((prev) => prev.filter((s) => s.id !== postSaveId));
      toast.success("Post removed from saved");
    }
  };

  const handleDeleteBook = async (bookId: string) => {
  const { error } = await supabase
    .from("books")
    .delete()
    .eq("id", bookId);

  if (!error) {
    setMyBooks((prev) => prev.filter((b) => b.id !== bookId));
    toast.success("Book listing deleted");
  } else {
    toast.error("Failed to delete book");
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("book-images")
      .upload(fileName, file, { upsert: true });
    if (uploadError) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage
      .from("book-images")
      .getPublicUrl(fileName);
    await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id);
    setProfile((prev: any) => ({ ...prev, avatar_url: urlData.publicUrl }));
    toast.success("Profile photo updated!");
  };

  const getPostStyle = (type: string) => {
    switch (type) {
      case "poem":  return "font-serif italic text-foreground";
      case "quote": return "italic text-foreground text-lg";
      case "story": return "text-foreground leading-relaxed";
      default:      return "text-foreground";
    }
  };

  const getPostTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      thought: "💭 Thought",
      snap:    "📸 Snap",
      poem:    "🎭 Poem",
      story:   "📖 Story",
      quote:   "💬 Quote",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-card rounded-3xl h-48 animate-pulse mb-8" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-8 shadow-card mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full gradient-warm p-1">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                  <img
                    src={
                      profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || "user"}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-soft hover:shadow-hover transition-shadow">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {profile?.full_name || profile?.username || "Book Lover"}
              </h1>
              <p className="text-muted-foreground mb-3">
                {profile?.bio || "No bio yet"}
              </p>
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{myBooks.length}</div>
                  <div className="text-sm text-muted-foreground">Books</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{myOrders.length}</div>
                  <div className="text-sm text-muted-foreground">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{myCommunities.length}</div>
                  <div className="text-sm text-muted-foreground">Communities</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{friends.length}</div>
                  <div className="text-sm text-muted-foreground">Friends</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{savedPosts.length}</div>
                  <div className="text-sm text-muted-foreground">Saved</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/edit-profile")}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto overflow-x-auto">
              {[
                { value: "books",       label: "My Books",    icon: Book },
                { value: "orders",      label: "My Orders",   icon: ShoppingBag },
                { value: "communities", label: "Communities", icon: Users },
                { value: "friends",     label: "Friends",     icon: UserCheck },
                { value: "saved",       label: "Saved",       icon: Bookmark },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.value === "friends" && pendingReceived.length > 0 && (
                      <span className="ml-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingReceived.length}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* My Books Tab */}
            <TabsContent value="books" className="mt-6">
              {myBooks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">📚</p>
                  <p className="text-muted-foreground">No books listed yet</p>
                  <Button variant="warm" className="mt-4" onClick={() => navigate("/sell")}>
                    List a Book
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myBooks.map((book) => (
  <div key={book.id} className="bg-card rounded-2xl p-4 shadow-soft flex gap-4">
    <img
      src={book.image_url || "https://via.placeholder.com/80x112?text=Book"}
      alt={book.title}
      className="w-20 h-28 object-cover rounded-xl"
    />
    <div className="flex-1">
      <h3 className="font-semibold text-foreground">{book.title}</h3>
      <p className="text-sm text-muted-foreground">{book.author}</p>
      <p className="text-sm text-accent font-medium mt-2">₹{book.price}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {book.is_sold ? "🔴 Sold" : "🟢 Listed"} • {book.condition}
      </p>
      {!book.is_sold && (
        <button
          onClick={() => handleDeleteBook(book.id)}
          className="mt-2 text-xs text-destructive hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Delete Listing
        </button>
      )}
    </div>
  </div>
))}
                 
                </div>
              )}
            </TabsContent>

            {/* My Orders Tab */}
            <TabsContent value="orders" className="mt-6">
              {myOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">🛍️</p>
                  <p className="text-muted-foreground">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => navigate("/order-tracking", { state: { orderId: order.id } })}
                      className="bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4 cursor-pointer hover:shadow-hover transition-all group"
                    >
                      <img
                        src={order.books?.image_url || "https://via.placeholder.com/60x80?text=Book"}
                        alt={order.books?.title}
                        className="w-14 h-20 object-cover rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {order.books?.title || "Book"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{order.books?.author}</p>
                        <p className="text-accent font-bold mt-1">₹{order.total_price}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ordered on{" "}
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold capitalize",
                          order.status === "delivered"  ? "bg-green-100 text-green-700" :
                          order.status === "shipped"    ? "bg-blue-100 text-blue-700" :
                          order.status === "confirmed"  ? "bg-purple-100 text-purple-700" :
                          "bg-yellow-100 text-yellow-700"
                        )}>
                          {order.status === "pending"   ? "⏳ Pending" :
                           order.status === "confirmed" ? "✅ Confirmed" :
                           order.status === "shipped"   ? "🚚 Shipped" :
                           order.status === "delivered" ? "📦 Delivered" :
                           order.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Communities Tab */}
            <TabsContent value="communities" className="mt-6">
              {myCommunities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">👥</p>
                  <p className="text-muted-foreground">No communities joined yet</p>
                  <Button variant="warm" className="mt-4" onClick={() => navigate("/communities")}>
                    Explore Communities
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myCommunities.map((item) => (
                    <div key={item.id} className="bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full gradient-warm flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.communities?.name}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Friends Tab */}
            <TabsContent value="friends" className="mt-6">
              <div className="space-y-8">

                {/* Pending Requests Received */}
                {pendingReceived.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      Friend Requests
                      <span className="bg-accent text-white text-xs rounded-full px-2 py-0.5">
                        {pendingReceived.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {pendingReceived.map((req) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4"
                        >
                          <img
                            src={
                              req.requester?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester?.id}`
                            }
                            alt="avatar"
                            className="w-12 h-12 rounded-full bg-muted"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {req.requester?.full_name || req.requester?.username || "Book Lover"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{req.requester?.username || "reader"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="warm" onClick={() => handleAcceptRequest(req.id)}>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeclineRequest(req.id)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accepted Friends */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-accent" />
                    My Friends ({friends.length})
                  </h3>
                  {friends.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-4xl mb-3">👋</p>
                      <p className="text-muted-foreground">No friends yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add readers from the Home page!
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {friends.map((friendship) => {
                        const friend =
                          friendship.requester?.id === currentUserId
                            ? friendship.receiver
                            : friendship.requester;
                        return (
                          <motion.div
                            key={friendship.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card rounded-2xl p-4 shadow-soft flex items-center gap-3"
                          >
                            <img
                              src={
                                friend?.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend?.id}`
                              }
                              alt="avatar"
                              className="w-12 h-12 rounded-full bg-muted"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {friend?.full_name || friend?.username || "Book Lover"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{friend?.username || "reader"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveFriend(friendship.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove friend"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sent Requests */}
                {pendingSent.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Sent Requests ({pendingSent.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingSent.map((req) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4"
                        >
                          <img
                            src={
                              req.receiver?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.receiver?.id}`
                            }
                            alt="avatar"
                            className="w-12 h-12 rounded-full bg-muted"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {req.receiver?.full_name || req.receiver?.username || "Book Lover"}
                            </p>
                            <p className="text-xs text-muted-foreground">⏳ Pending</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeclineRequest(req.id)}
                          >
                            Cancel
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Saved Posts Tab */}
            <TabsContent value="saved" className="mt-6">
              {savedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">🔖</p>
                  <p className="text-xl font-semibold text-foreground mb-2">No saved posts yet</p>
                  <p className="text-muted-foreground mb-4">
                    Tap the bookmark icon on any post in the Feed to save it here
                  </p>
                  <Button variant="warm" onClick={() => navigate("/feed")}>
                    Browse Feed
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {savedPosts.map((save) => {
                    const post = save.posts;
                    if (!post) return null;
                    return (
                      <motion.div
                        key={save.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-2xl p-5 shadow-soft flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                post.profiles?.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`
                              }
                              alt="avatar"
                              className="w-9 h-9 rounded-full object-cover bg-muted"
                            />
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {post.profiles?.full_name || post.profiles?.username || "User"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getPostTypeLabel(post.type)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnsavePost(save.id)}
                            className="text-accent hover:text-muted-foreground transition-colors"
                            title="Remove from saved"
                          >
                            <Bookmark className="w-5 h-5 fill-current" />
                          </button>
                        </div>
                        {post.book_title && (
                          <p className="text-xs text-accent font-medium">📚 {post.book_title}</p>
                        )}
                        <p className={cn("text-sm line-clamp-4", getPostStyle(post.type))}>
                          {post.content}
                        </p>
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="post"
                            className="w-full h-40 object-cover rounded-xl"
                          />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </main>
    </div>
  );
}