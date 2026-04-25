import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home, Users, BookPlus, MessageCircle, ShoppingCart,
  User, Search, BookOpen, Rss, Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { to: "/home",        label: "Home",        icon: Home          },
  { to: "/feed",        label: "Feed",        icon: Rss           },
  { to: "/communities", label: "Communities", icon: Users         },
  { to: "/sell",        label: "Sell",        icon: BookPlus      },
  { to: "/chat",        label: "Chat",        icon: MessageCircle },
  { to: "/cart",        label: "Cart",        icon: ShoppingCart  },
  { to: "/profile",     label: "Profile",     icon: User          },
];

// Pages where navbar should NOT appear at all
const hiddenOnPaths = ["/", "/login"];

// Pages where navbar should be hidden on MOBILE only
const mobileHiddenOnPaths = ["/chat"];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  // Hide completely on landing/login
  if (hiddenOnPaths.includes(location.pathname)) return null;

  // Hide on mobile for chat page (chat has its own full-screen header)
  const isMobileHidden = mobileHiddenOnPaths.includes(location.pathname);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    setPendingCount(count || 0);
  };

  const handleBellClick = () => {
    navigate("/profile", { state: { tab: "friends" } });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-soft",
        // On mobile, hide entirely on chat page so it takes zero space
        isMobileHidden && "hidden md:block"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:block">
              Book<span className="text-accent">Buddies</span>
            </span>
          </Link>

          {/* Search Bar - Desktop only */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search books, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-transparent focus:border-accent"
              />
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "nav-link flex items-center gap-2",
                    isActive && "active text-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              );
            })}

            {/* Desktop Notification Bell */}
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors ml-1"
              title="Friend Requests"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                >
                  {pendingCount > 9 ? "9+" : pendingCount}
                </motion.span>
              )}
            </button>
          </div>

          {/* Mobile: Only show Logo + Bell (bottom nav handles navigation) */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-accent transition-colors"
              title="Friend Requests"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                >
                  {pendingCount > 9 ? "9+" : pendingCount}
                </motion.span>
              )}
            </button>
          </div>

        </div>
      </div>
    </motion.nav>
  );
}