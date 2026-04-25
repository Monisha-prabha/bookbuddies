import { Button } from "../components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Mail, Lock, Eye, EyeOff, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();

  // Login / Signup state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // Reset password state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  // Detect if user came from a password reset email
useEffect(() => {
  // Fallback: check hash directly (handles immediate render)
  const hashParams = new URLSearchParams(
    window.location.hash.replace("#", "?")
  );
  if (hashParams.get("type") === "recovery") {
    setShowResetPassword(true);
  }

  // Primary: listen for Supabase PASSWORD_RECOVERY event
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      setShowResetPassword(true);
    }
  });

  return () => subscription.unsubscribe();
}, []);

  // ── Login / Signup ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMessage("Account created successfully!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSuccessMessage("Welcome back!");
      }

      setShowSuccess(true);
      setTimeout(() => { navigate("/home"); }, 1500);

    } catch (error: any) {
      let message = "Something went wrong.";
      if (error.message.includes("Invalid login credentials")) {
        message = "Invalid email or password.";
      } else if (error.message.includes("User already registered")) {
        message = "Email already registered.";
      } else if (error.message.includes("Password should be at least 6 characters")) {
        message = "Password should be at least 6 characters.";
      } else if (error.message) {
        message = error.message;
      }
      setErrorMessage(message);
    }

    setIsLoading(false);
  };

  // ── Forgot Password ──
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address.");
      return;
    }

    setForgotLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim(),
      { redirectTo: `${window.location.origin}/login` }
    );

    if (error) {
      setForgotError(error.message);
    } else {
      setForgotSuccess(true);
    }

    setForgotLoading(false);
  };

  // ── Reset Password ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setResetError(error.message);
    } else {
      toast.success("Password updated successfully! 🎉");
      setShowResetPassword(false);
      navigate("/home");
    }

    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-warm flex items-center justify-center shadow-soft">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              Book<span className="text-accent">Buddies</span>
            </span>
          </Link>

          <AnimatePresence mode="wait">

            {/* ── 1. Success Screen ── */}
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {successMessage}
                </h2>
                <p className="text-muted-foreground">Redirecting...</p>
              </motion.div>

            ) : showResetPassword ? (

              /* ── 2. Reset Password Screen ── */
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
              >
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Set New Password 🔒
                </h1>
                <p className="text-muted-foreground mb-8">
                  Enter your new password below.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-12 pr-12 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {resetError && (
                    <p className="text-red-500 text-sm">{resetError}</p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Updating..." : "Update Password 🔒"}
                  </Button>
                </form>
              </motion.div>

            ) : showForgotPassword ? (

              /* ── 3. Forgot Password Screen ── */
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
              >
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSuccess(false);
                    setForgotError("");
                    setForgotEmail("");
                  }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>

                {forgotSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
                      <Mail className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Check your inbox! 📬
                    </h2>
                    <p className="text-muted-foreground mb-2">
                      We sent a password reset link to:
                    </p>
                    <p className="text-accent font-semibold mb-6">
                      {forgotEmail}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click the link in the email to reset your password.
                      Check your spam folder if you don't see it.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotSuccess(false);
                        setForgotEmail("");
                      }}
                    >
                      Back to Login
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      Forgot Password?
                    </h1>
                    <p className="text-muted-foreground mb-8">
                      Enter your email and we'll send you a reset link.
                    </p>

                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="pl-12 h-12"
                          />
                        </div>
                      </div>

                      {forgotError && (
                        <p className="text-red-500 text-sm">{forgotError}</p>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={forgotLoading}
                      >
                        {forgotLoading ? "Sending..." : "Send Reset Link 📧"}
                      </Button>
                    </form>
                  </>
                )}
              </motion.div>

            ) : (

              /* ── 4. Login / Signup Screen ── */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="text-muted-foreground mb-8">
                  {isSignUp ? "Join our community" : "Sign in to continue"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setForgotEmail(email);
                            setErrorMessage("");
                          }}
                          className="text-sm text-accent hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="text-red-500 text-sm">{errorMessage}</p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Loading..."
                      : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                  </Button>
                </form>

                <p className="text-center text-muted-foreground mt-6">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(""); }}
                    className="text-accent font-medium"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}