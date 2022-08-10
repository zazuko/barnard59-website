import { FC, ReactNode } from 'react';
import Container from "@mui/material/Container";

type Props = {
  children: ReactNode;
}

const Component: FC<Props> = ({ children }) => {
  return <Container maxWidth="xl">{children}</Container>;
};

export default Component;
