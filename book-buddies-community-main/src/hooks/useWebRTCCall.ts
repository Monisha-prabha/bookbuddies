// src/hooks/useWebRTCCall.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type CallState = "idle" | "calling" | "incoming" | "connected" | "ended";

interface UseWebRTCCallOptions {
  currentUserId: string | null;
  remoteUserId: string | null;
  remoteUserName: string;
  remoteUserAvatar?: string;
}

interface SignalPayload {
  type:
    | "call-request"
    | "call-accepted"
    | "call-declined"
    | "call-ended"
    | "offer"
    | "answer"
    | "ice-candidate";
  from: string;
  to: string;
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit;
  callerName?: string;
  callerAvatar?: string;
}

export function useWebRTCCall({
  currentUserId,
  remoteUserId,
  remoteUserName,
  remoteUserAvatar,
}: UseWebRTCCallOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [incomingCaller, setIncomingCaller] = useState<{
    name: string;
    avatar?: string;
  } | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const channelName =
    currentUserId && remoteUserId
      ? `call:${[currentUserId, remoteUserId].sort().join(":")}`
      : null;

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const sendSignal = useCallback(
    (payload: SignalPayload) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload,
      });
    },
    []
  );

  const cleanUp = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    setIsMuted(false);
    setIncomingCaller(null);
  }, []);

  const createPeer = useCallback(() => {
    const peer = new RTCPeerConnection({ iceServers });

    peer.onicecandidate = (event) => {
      if (event.candidate && currentUserId && remoteUserId) {
        sendSignal({
          type: "ice-candidate",
          from: currentUserId,
          to: remoteUserId,
          data: event.candidate.toJSON(),
        });
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        setCallState("connected");
      } else if (
        peer.connectionState === "disconnected" ||
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
      ) {
        cleanUp();
        setCallState("ended");
        setTimeout(() => setCallState("idle"), 2000);
      }
    };

    // Play remote audio
    peer.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
    };

    return peer;
  }, [currentUserId, remoteUserId, sendSignal, cleanUp]);

  const getLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const startCall = useCallback(async () => {
    if (!currentUserId || !remoteUserId) return;
    try {
      setCallState("calling");
      await getLocalStream();
      const peer = createPeer();
      peerRef.current = peer;
      localStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          peer.addTrack(track, localStreamRef.current!)
        );

      sendSignal({
        type: "call-request",
        from: currentUserId,
        to: remoteUserId,
        callerName: remoteUserName,
        callerAvatar: remoteUserAvatar,
      });
    } catch (err) {
      console.error("Failed to start call", err);
      setCallState("idle");
    }
  }, [
    createPeer,
    currentUserId,
    getLocalStream,
    remoteUserId,
    remoteUserAvatar,
    remoteUserName,
    sendSignal,
  ]);

  const acceptCall = useCallback(async () => {
    if (!currentUserId || !remoteUserId) return;
    try {
      const stream = await getLocalStream();
      const peer = peerRef.current!;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      sendSignal({
        type: "call-accepted",
        from: currentUserId,
        to: remoteUserId,
      });
      setCallState("connected");
    } catch (err) {
      console.error("Failed to accept call", err);
    }
  }, [currentUserId, getLocalStream, remoteUserId, sendSignal]);

  const declineCall = useCallback(() => {
    if (!currentUserId || !remoteUserId) return;
    sendSignal({
      type: "call-declined",
      from: currentUserId,
      to: remoteUserId,
    });
    cleanUp();
    setCallState("idle");
  }, [cleanUp, currentUserId, remoteUserId, sendSignal]);

  const hangUp = useCallback(
    (notify = true) => {
      if (notify && currentUserId && remoteUserId) {
        sendSignal({
          type: "call-ended",
          from: currentUserId,
          to: remoteUserId,
        });
      }
      cleanUp();
      setCallState("ended");
      setTimeout(() => setCallState("idle"), 2000);
    },
    [cleanUp, currentUserId, remoteUserId, sendSignal]
  );

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Supabase Realtime signaling channel
  useEffect(() => {
    if (!channelName || !currentUserId) return;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channelRef.current = channel;

    channel.on(
      "broadcast",
      { event: "signal" },
      async ({ payload }: { payload: SignalPayload }) => {
        if (payload.to !== currentUserId) return;

        switch (payload.type) {
          case "call-request": {
            const peer = createPeer();
            peerRef.current = peer;
            setIncomingCaller({
              name: remoteUserName,
              avatar: remoteUserAvatar,
            });
            setCallState("incoming");
            break;
          }

          case "call-accepted": {
            const peer = peerRef.current;
            if (!peer || !remoteUserId) return;
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            sendSignal({
              type: "offer",
              from: currentUserId,
              to: remoteUserId,
              data: offer,
            });
            break;
          }

          case "call-declined": {
            cleanUp();
            setCallState("ended");
            setTimeout(() => setCallState("idle"), 2000);
            break;
          }

          case "offer": {
            const peer = peerRef.current;
            if (!peer || !remoteUserId || !payload.data) return;
            await peer.setRemoteDescription(
              new RTCSessionDescription(
                payload.data as RTCSessionDescriptionInit
              )
            );
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            sendSignal({
              type: "answer",
              from: currentUserId,
              to: remoteUserId,
              data: answer,
            });
            break;
          }

          case "answer": {
            const peer = peerRef.current;
            if (!peer || !payload.data) return;
            await peer.setRemoteDescription(
              new RTCSessionDescription(
                payload.data as RTCSessionDescriptionInit
              )
            );
            break;
          }

          case "ice-candidate": {
            const peer = peerRef.current;
            if (!peer || !payload.data) return;
            try {
              await peer.addIceCandidate(
                new RTCIceCandidate(
                  payload.data as RTCIceCandidateInit
                )
              );
            } catch (e) {
              console.warn("ICE candidate error", e);
            }
            break;
          }

          case "call-ended": {
            cleanUp();
            setCallState("ended");
            setTimeout(() => setCallState("idle"), 2000);
            break;
          }
        }
      }
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [
    channelName,
    cleanUp,
    createPeer,
    currentUserId,
    remoteUserId,
    remoteUserAvatar,
    remoteUserName,
    sendSignal,
  ]);

  return {
    callState,
    isMuted,
    incomingCaller,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
  };
}