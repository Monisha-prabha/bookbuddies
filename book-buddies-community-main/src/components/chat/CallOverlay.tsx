// src/components/chat/CallOverlay.tsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import type { CallState } from "@/hooks/useWebRTCCall";

interface CallOverlayProps {
  callState: CallState;
  isMuted: boolean;
  remoteUserName: string;
  remoteUserAvatar?: string;
  incomingCaller: { name: string; avatar?: string } | null;
  onAccept: () => void;
  onDecline: () => void;
  onHangUp: () => void;
  onToggleMute: () => void;
}

export function CallOverlay({
  callState,
  isMuted,
  remoteUserName,
  remoteUserAvatar,
  incomingCaller,
  onAccept,
  onDecline,
  onHangUp,
  onToggleMute,
}: CallOverlayProps) {
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (callState === "connected") {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callState === "idle") setDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const caller = incomingCaller ?? {
    name: remoteUserName,
    avatar: remoteUserAvatar,
  };

  const avatarLetter = caller.name?.[0]?.toUpperCase() ?? "?";

  const statusText =
    callState === "calling"
      ? "Calling..."
      : callState === "incoming"
      ? "Incoming voice call"
      : callState === "connected"
      ? formatDuration(duration)
      : callState === "ended"
      ? "Call ended"
      : "";

  return (
    <AnimatePresence>
      {callState !== "idle" && (
        <motion.div
          key="call-overlay"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-between px-6 py-16 select-none"
          style={{
            background:
              "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
          }}
        >
          {/* Decorative background circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute rounded-full opacity-5"
              style={{
                width: 500,
                height: 500,
                top: -100,
                left: -100,
                background: "radial-gradient(circle, #e07b39 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute rounded-full opacity-5"
              style={{
                width: 400,
                height: 400,
                bottom: -80,
                right: -80,
                background: "radial-gradient(circle, #e07b39 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Top — caller info */}
          <div className="flex flex-col items-center gap-5 mt-10 z-10">
            <div className="relative">
              {/* Pulse rings */}
              {(callState === "calling" || callState === "incoming") && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-orange-400/30"
                    animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-orange-400/20"
                    animate={{ scale: [1, 1.7, 1.7], opacity: [0.4, 0, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeOut",
                      delay: 0.4,
                    }}
                  />
                </>
              )}

              {/* Avatar */}
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl">
                {caller.avatar ? (
                  <img
                    src={caller.avatar}
                    alt={caller.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700 text-white text-4xl font-bold">
                    {avatarLetter}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-white text-2xl font-semibold tracking-tight">
                {caller.name}
              </h2>
              <motion.p
                key={statusText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-medium mt-1 tracking-wide ${
                  callState === "connected"
                    ? "text-green-400"
                    : callState === "ended"
                    ? "text-red-400"
                    : "text-white/50"
                }`}
              >
                {statusText}
              </motion.p>
            </div>

            {/* Audio wave when connected */}
            {callState === "connected" && (
              <div className="flex items-end gap-1 h-7">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-green-400"
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.7 + i * 0.08,
                      ease: "easeInOut",
                      delay: i * 0.1,
                    }}
                    style={{ height: 24, transformOrigin: "bottom" }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom — buttons */}
          <div className="z-10 w-full flex justify-center mb-6">
            {callState === "incoming" ? (
              <div className="flex gap-20 items-end">
                {/* Decline */}
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onDecline}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: "rgba(239,68,68,0.9)" }}
                  >
                    <PhoneOff className="text-white w-7 h-7" />
                  </motion.button>
                  <span className="text-white/50 text-xs tracking-wide">Decline</span>
                </div>

                {/* Accept */}
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    onClick={onAccept}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: "rgba(34,197,94,0.9)" }}
                  >
                    <Phone className="text-white w-7 h-7" />
                  </motion.button>
                  <span className="text-white/50 text-xs tracking-wide">Accept</span>
                </div>
              </div>
            ) : callState === "calling" || callState === "connected" ? (
              <div className="flex gap-14 items-end">
                {/* Mute */}
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onToggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isMuted
                        ? "bg-white text-gray-900"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </motion.button>
                  <span className="text-white/50 text-xs tracking-wide">
                    {isMuted ? "Unmute" : "Mute"}
                  </span>
                </div>

                {/* End call */}
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onHangUp}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: "rgba(239,68,68,0.9)" }}
                  >
                    <PhoneOff className="text-white w-7 h-7" />
                  </motion.button>
                  <span className="text-white/50 text-xs tracking-wide">End</span>
                </div>
              </div>
            ) : callState === "ended" ? (
              <p className="text-white/30 text-sm">Closing...</p>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}