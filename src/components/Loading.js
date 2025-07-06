import styled from "styled-components";
import { InstructionsMessage } from "./Instructions";

const LoadingMessage = styled(InstructionsMessage)``;

export const Loading = ({ message }) => {
  return <LoadingMessage>{message || "Loading..."}</LoadingMessage>;
};
