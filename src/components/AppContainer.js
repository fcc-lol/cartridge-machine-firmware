import React from "react";
import styled from "styled-components";

const BaseContainer = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    !["fullscreen", "center", "background"].includes(prop)
})`
  ${(props) =>
    props.fullscreen
      ? `
    width: 100vw;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  `
      : `
    width: 100%;
    height: 100%;
    position: relative;
  `}

  overflow: hidden;

  ${(props) =>
    props.center &&
    `
    display: flex;
    align-items: center;
    justify-content: center;
  `}

  ${(props) =>
    props.background &&
    `
    background: ${props.background};
  `}
`;

/**
 * Standardized container component for all apps
 *
 * @param {boolean} fullscreen - Use viewport units (100vw/100vh) with absolute positioning
 * @param {boolean} center - Center content using flexbox
 * @param {string} background - Background color/value
 * @param {React.ReactNode} children - Child components
 * @param {object} props - Additional props passed to the container
 */
const AppContainer = ({
  fullscreen = false,
  center = false,
  background = null,
  children,
  ...props
}) => {
  return (
    <BaseContainer
      fullscreen={fullscreen}
      center={center}
      background={background}
      {...props}
    >
      {children}
    </BaseContainer>
  );
};

export default AppContainer;
