import styled from "styled-components";
import { InstructionsMessage } from "./Instructions";

const LoadingMessage = styled(InstructionsMessage)`
  margin-top: -1rem;
`;

export const Loading = ({ message }) => {
  return <LoadingMessage>{message || "Loading..."}</LoadingMessage>;
};
