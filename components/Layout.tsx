import { FC, ReactNode } from 'react';
import Content from "./ui/Content";
import Header from "./ui/Header";

type Props = {
  children: ReactNode;
};

const Component: FC<Props> = ({ children }) => {
  return (
    <>
      <Header />
      <Content>{children}</Content>
      <footer></footer>
    </>
  );
};

export default Component;
