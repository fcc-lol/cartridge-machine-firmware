import React, { useEffect, useRef } from "react";
import styled from "styled-components";

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s ease-in;
  background: black;
  border-radius: 1rem;

  &.video-loaded {
    opacity: 1;
  }
`;

const AspectRatioContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: calc(240 / 320 * 100%);
  max-height: 100%;
`;

const VideoWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  max-width: calc(100vh * (352 / 240));
  max-height: 100%;
  overflow: hidden;
`;

const ScaledWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  overflow: hidden;
`;

const InnerWrapper = styled.div`
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  overflow: hidden;
  pointer-events: none;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: scale(1.2);
    transform-origin: center center;
    border: 0;
    pointer-events: none;
  }
`;

const Scanline = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.2) 2px,
    rgba(0, 0, 0, 0.2) 4px
  );
  pointer-events: none;
  z-index: 4;
  mix-blend-mode: overlay;
`;

const Color = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(0, 0, 0, 0.5) 100%
  );
  mix-blend-mode: overlay;
  z-index: 2;
`;

const Label = styled.div`
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: "DM Mono", monospace;
  font-weight: 600;
  font-size: 1.25rem;
  text-transform: uppercase;
  z-index: 1;
  color: #fff;
  letter-spacing: 0.2rem;
  opacity: 1;
  text-shadow: 0 0 1rem rgba(255, 255, 255, 1);
`;

const YouTubeLiveVideo = ({ source, label }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.classList.add("video-loaded");
      }
    }, 1000);
  }, []);

  return (
    <VideoContainer ref={containerRef}>
      <AspectRatioContainer>
        <VideoWrapper>
          <ScaledWrapper>
            <InnerWrapper>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${source}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&enablejsapi=1&rel=0`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; compute-pressure"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </InnerWrapper>
            {label && <Label>{label}</Label>}
            <Scanline />
            <Color />
          </ScaledWrapper>
        </VideoWrapper>
      </AspectRatioContainer>
    </VideoContainer>
  );
};

export default YouTubeLiveVideo;
