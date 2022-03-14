import Content from "./ui/Content";
import Header from "./ui/Header";

const Component: React.FC = ({ children }) => {
  return (
    <>
      <Header />
      <Content>{children}</Content>
      <footer></footer>
    </>
  );
};

export default Component;
