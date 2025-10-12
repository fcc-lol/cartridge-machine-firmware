import React, { useState } from "react";
import styled from "styled-components";
import { Loading } from "../components/Loading";
import { Error } from "../components/Error";
import AppContainer from "../components/AppContainer";

const SlideshowIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: black;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
`;

function FCCMomentsSlideshow() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError("Failed to load Moments slideshow");
    setLoading(false);
  };

  return (
    <AppContainer fullscreen background="black">
      {loading && (
        <LoadingOverlay>
          <Loading />
        </LoadingOverlay>
      )}

      {error && <Error message={error} />}

      <SlideshowIframe
        src="https://moments.fcc.lol/slideshow"
        title="Moments"
        onLoad={handleLoad}
        onError={handleError}
        allow="autoplay; fullscreen"
      />
    </AppContainer>
  );
}

export default FCCMomentsSlideshow;
