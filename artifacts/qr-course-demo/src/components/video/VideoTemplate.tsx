import { useEffect, useRef } from "react";
import { useVideoPlayer } from "@/lib/video";
import { DEMO_DURATION_MS } from "./recording";

export const SCENE_DURATIONS = { demonstration: DEMO_DURATION_MS };

/** Real browser footage with narration; no simulated UI or promotional overlays. */
export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });
  const media = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
    if (media.current) {
      media.current.currentTime = 0;
      void media.current.play().catch(() => {
        // Browser autoplay permission is granted by the player's unmute action.
      });
    }
  }, [currentSceneKey, onSceneChange]);

  useEffect(() => {
    if (media.current) {
      media.current.muted = muted;
      void media.current.play().catch(() => {});
    }
  }, [muted]);

  return (
    <video
      ref={media}
      src={`${import.meta.env.BASE_URL}calculus-demonstration.mp4`}
      poster={`${import.meta.env.BASE_URL}calculus-poster.jpg`}
      controls
      autoPlay
      playsInline
      loop={loop}
      muted={muted}
      aria-label="Calculus: a narrated demonstration recorded from the working app"
      style={{ width: "100vw", height: "100vh", objectFit: "contain", background: "#f9f8f5" }}
    />
  );
}