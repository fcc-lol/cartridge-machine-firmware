import styled from "styled-components";
import { InstructionsMessage } from "./Instructions";

const ErrorMessage = styled(InstructionsMessage)`
  color: red;
`;

export const Error = ({ message }) => {
  return <ErrorMessage>{message}</ErrorMessage>;
};
