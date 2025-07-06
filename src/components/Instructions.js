import styled from "styled-components";

export const InstructionsMessage = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  margin-top: -1rem;
  font-family: monospace;
  text-transform: uppercase;
`;

export const Instructions = ({ message }) => {
  return (
    <InstructionsMessage>{message || "Insert a cartridge"}</InstructionsMessage>
  );
};
