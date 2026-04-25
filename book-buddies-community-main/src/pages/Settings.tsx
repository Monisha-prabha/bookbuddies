import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Trash2,
  Moon,
  Sun,
  Bell,
  Shield,
  ChevronRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Check,
  BookOpen,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// ── Toggle Switch Component ──
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-300",
        enabled ? "bg-accent" : "bg-secondary"
      )}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        animate={{ left: enabled ? "calc(100% - 20px)" : "4px" }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
    </button>
  );
}

// ── Section Card ──
function SettingsSection({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-2xl shadow-soft overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </motion.div>
  );
}

export default function Settings() {
  const navigate = useNavigate();

  // Appearance
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Notifications
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(false);
  const [notifPromotions, setNotifPromotions] = useState(false);

  // Privacy
  const [profilePublic, setProfilePublic] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  // Change Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Delete Account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // User email
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
    };
    getUser();
  }, []);

  // Dark mode toggle
  const handleDarkMode = (val: boolean) => {
    setIsDarkMode(val);
    if (val) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    toast.success(`${val ? "Dark" : "Light"} mode enabled`);
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPw(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error("Failed to change password: " + error.message);
    } else {
      toast.success("Password changed successfully! 🔒");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setIsChangingPw(false);
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete profile data first
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.from("cart").delete().eq("user_id", user.id);

      // Sign out
      await supabase.auth.signOut();
      toast.success("Account deleted. We'll miss you! 📚");
      navigate("/");
    } catch (err: any) {
      toast.error("Failed to delete account: " + err.message);
    }

    setIsDeletingAccount(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-warm flex items-center justify-center shadow-soft">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">

          {/* ── Appearance ── */}
          <SettingsSection title="Appearance" icon={Sun} delay={0.1}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="w-5 h-5 text-accent" />
                ) : (
                  <Sun className="w-5 h-5 text-accent" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark theme
                  </p>
                </div>
              </div>
              <Toggle enabled={isDarkMode} onChange={handleDarkMode} />
            </div>
          </SettingsSection>

          {/* ── Notifications ── */}
          <SettingsSection title="Notifications" icon={Bell} delay={0.2}>
            {[
              {
                label: "Messages",
                desc: "New chat messages",
                val: notifMessages,
                set: setNotifMessages,
              },
              {
                label: "Orders",
                desc: "Order status updates",
                val: notifOrders,
                set: setNotifOrders,
              },
              {
                label: "Community",
                desc: "Community discussions",
                val: notifCommunity,
                set: setNotifCommunity,
              },
              {
                label: "Promotions",
                desc: "Deals and offers",
                val: notifPromotions,
                set: setNotifPromotions,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  enabled={item.val}
                  onChange={(v) => {
                    item.set(v);
                    toast.success(
                      `${item.label} notifications ${v ? "enabled" : "disabled"}`
                    );
                  }}
                />
              </div>
            ))}
          </SettingsSection>

          {/* ── Privacy ── */}
          <SettingsSection title="Privacy" icon={Shield} delay={0.3}>
            {[
              {
                label: "Public Profile",
                desc: "Let others find and view your profile",
                val: profilePublic,
                set: setProfilePublic,
              },
              {
                label: "Show Activity",
                desc: "Show when you were last active",
                val: showActivity,
                set: setShowActivity,
              },
              {
                label: "Show Email",
                desc: "Display email on your profile",
                val: showEmail,
                set: setShowEmail,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  enabled={item.val}
                  onChange={(v) => {
                    item.set(v);
                    toast.success(`${item.label} ${v ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            ))}
          </SettingsSection>

          {/* ── Change Password ── */}
          <SettingsSection title="Change Password" icon={Lock} delay={0.4}>
            <div className="space-y-4">
              {/* New Password */}
              <div>
                <Label>New Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <Label>Confirm New Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password match indicator */}
              {newPassword && confirmPassword && (
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    newPassword === confirmPassword
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  {newPassword === confirmPassword ? (
                    <><Check className="w-4 h-4" /> Passwords match</>
                  ) : (
                    <><span>✗</span> Passwords do not match</>
                  )}
                </div>
              )}

              <Button
                variant="warm"
                onClick={handleChangePassword}
                disabled={isChangingPw}
                className="w-full"
              >
                {isChangingPw ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                {isChangingPw ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </SettingsSection>

          {/* ── Delete Account ── */}
          <SettingsSection title="Delete Account" icon={Trash2} delay={0.5}>
            {!showDeleteConfirm ? (
              <div>
                <p className="text-muted-foreground text-sm mb-4">
                  ⚠️ This will permanently delete your account, all your book listings,
                  orders, and messages. This action cannot be undone.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 font-semibold text-sm mb-1">
                    ⚠️ Are you absolutely sure?
                  </p>
                  <p className="text-red-500 text-sm">
                    Type <span className="font-bold font-mono">DELETE</span> below
                    to confirm account deletion.
                  </p>
                </div>

                <Input
                  placeholder='Type "DELETE" to confirm'
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  className="border-red-300 focus:border-red-500"
                />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || deleteText !== "DELETE"}
                  >
                    {isDeletingAccount ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {isDeletingAccount ? "Deleting..." : "Yes, Delete"}
                  </Button>
                </div>
              </motion.div>
            )}
          </SettingsSection>

          {/* App Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-4"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="font-semibold text-foreground">BookBuddies</span>
            </div>
            <p className="text-xs text-muted-foreground">Version 1.0.0 • Made with ❤️ for book lovers</p>
          </motion.div>

        </div>
      </main>
    </div>
  );
}