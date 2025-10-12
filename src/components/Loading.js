import styled from "styled-components";
import { InstructionsMessage } from "./Instructions";

const LoadingMessage = styled(InstructionsMessage)`
  margin-top: 0;
`;

export const Loading = ({ message }) => {
  return <LoadingMessage>{message || "Loading..."}</LoadingMessage>;
};
