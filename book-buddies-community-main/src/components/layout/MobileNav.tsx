import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Rss, BookPlus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavLinks = [
  { to: "/home",    label: "Home",    icon: Home          },
  { to: "/feed",    label: "Feed",    icon: Rss           },
  { to: "/sell",    label: "Sell",    icon: BookPlus      },
  { to: "/chat",    label: "Chat",    icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User          },
];

const hiddenOnPaths = ["/", "/login"];

export function MobileNav() {
  const location = useLocation();

  if (hiddenOnPaths.includes(location.pathname)) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      // h-16 = 64px exactly — this is the source of truth for bottom nav height
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16"
    >
      <div className="h-full bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_-4px_hsl(var(--brown)/0.12)]">
        <div className="flex items-center justify-around px-2 h-full">
          {mobileNavLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            const isSell = link.to === "/sell";

            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                {isSell ? (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-0.5 -mt-5",
                      "gradient-warm shadow-[0_4px_16px_hsl(var(--orange)/0.4)]"
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200",
                      isActive
                        ? "bg-accent/15 text-accent"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="absolute top-1 w-1 h-1 rounded-full bg-accent"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.div>
                )}

                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-200",
                    isSell
                      ? "text-accent font-semibold"
                      : isActive
                      ? "text-accent"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}