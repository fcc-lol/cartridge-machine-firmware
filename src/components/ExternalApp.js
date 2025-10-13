import React, { useState } from "react";
import styled from "styled-components";
import { Loading } from "./Loading";
import { Error } from "./Error";
import AppContainer from "./AppContainer";

const Frame = styled.iframe`
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

function ExternalApp({ src, title, errorMessage }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError(errorMessage || `Failed to load ${title}`);
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

      <Frame
        src={src}
        title={title}
        onLoad={handleLoad}
        onError={handleError}
        allow="autoplay; fullscreen"
      />
    </AppContainer>
  );
}

export default ExternalApp;
