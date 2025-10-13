import React from "react";
import styled from "styled-components";
import YouTubeLiveVideo from "../components/YouTubeLiveVideo";

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  width: calc(100% - 4rem);
  height: calc(100% - 4rem);
  gap: 1.5rem;
  background: black;
  padding: 2rem;
`;

function LiveCameras() {
  const cameraFeeds = [
    { source: "gFRtAAmiFbE", label: "Kabukicho A" },
    { source: "ErHJBXTmm2Q", label: "Kabukicho B" },
    { source: "lA6TaaMGgDo", label: "Shinjuku A" },
    { source: "GLQhbRGv5qU", label: "Shinjuku B" }
  ];

  return (
    <GridContainer>
      {cameraFeeds.map((feed, index) => (
        <YouTubeLiveVideo key={index} source={feed.source} label={feed.label} />
      ))}
    </GridContainer>
  );
}

export default LiveCameras;
