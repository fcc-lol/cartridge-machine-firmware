import React, { useState } from "react";
import styled from "styled-components";
import { Loading } from "../components/Loading";
import { Error } from "../components/Error";

const SlideshowContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
`;

const SlideshowIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: black;
`;

function FCCMomentsSlideshow() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError("Failed to load FCC moments slideshow");
    setLoading(false);
  };

  return (
    <SlideshowContainer>
      {error && <Error message={error} />}

      {loading && <Loading />}

      <SlideshowIframe
        src="https://moments.fcc.lol/slideshow"
        title="FCC Moments Slideshow"
        onLoad={handleLoad}
        onError={handleError}
        allow="autoplay; fullscreen"
      />
    </SlideshowContainer>
  );
}

export default FCCMomentsSlideshow;
