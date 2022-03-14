import Container from "@mui/material/Container";

const Component: React.FC = ({ children }) => {
  return <Container maxWidth="xl">{children}</Container>;
};

export default Component;
