import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Slider, Space, Tooltip, Typography } from "antd";
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  MutedOutlined,
  FastForwardOutlined,
  BackwardOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function VideoPlayer({
  src,
  initialTime = 0,
  onTime,
  onEnded,
  onReady,
  className,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const speedOptions = useMemo(() => [0.75, 1, 1.25, 1.5, 2], []);

  const safeSetTime = (seconds) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(seconds)) return;
    const clamped = Math.max(0, Math.min(seconds, Number.isFinite(video.duration) ? video.duration : seconds));
    video.currentTime = clamped;
    setCurrentTime(clamped);
    onTime?.(clamped);
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        // ignore autoplay restrictions
      }
    } else {
      video.pause();
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      const container = containerRef.current;
      setIsFullscreen(Boolean(document.fullscreenElement && container && document.fullscreenElement === container));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setIsReady(true);

      if (initialTime > 0 && video.currentTime < 1) {
        safeSetTime(initialTime);
      }

      onReady?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
      onTime?.(video.currentTime || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", position: "relative", background: "#000" }}>
      <video ref={videoRef} src={src} controls={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "10px 12px",
          background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))",
        }}
      >
        <Slider
          value={duration ? (currentTime / duration) * 100 : 0}
          tooltip={{ formatter: null }}
          onChange={(v) => {
            const pct = Number(v) || 0;
            safeSetTime((pct / 100) * (duration || 0));
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Space>
            <Tooltip title={isPlaying ? "Tạm dừng" : "Phát"}>
              <Button type="primary" shape="circle" icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={togglePlay} />
            </Tooltip>
            <Tooltip title="Lùi 10s">
              <Button icon={<BackwardOutlined />} onClick={() => safeSetTime((currentTime || 0) - 10)} />
            </Tooltip>
            <Tooltip title="Tới 10s">
              <Button icon={<FastForwardOutlined />} onClick={() => safeSetTime((currentTime || 0) + 10)} />
            </Tooltip>
            <Tooltip title={isMuted ? "Bật tiếng" : "Tắt tiếng"}>
              <Button icon={isMuted ? <MutedOutlined /> : <SoundOutlined />} onClick={() => setIsMuted((v) => !v)} />
            </Tooltip>
            <div style={{ width: 120 }}>
              <Slider min={0} max={1} step={0.05} value={volume} onChange={(v) => setVolume(Number(v))} />
            </div>
          </Space>

          <Space>
            <Text style={{ color: "#fff" }}>{isReady ? `${Math.floor(currentTime)}s / ${Math.floor(duration)}s` : "..."}</Text>
            <Space.Compact>
              {speedOptions.map((s) => (
                <Button key={s} type={s === playbackRate ? "primary" : "default"} onClick={() => setPlaybackRate(s)}>
                  {s}x
                </Button>
              ))}
            </Space.Compact>
            <Tooltip title={isFullscreen ? "Thoát fullscreen" : "Fullscreen"}>
              <Button icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} />
            </Tooltip>
          </Space>
        </div>
      </div>
    </div>
  );
}
