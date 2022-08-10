import { FC } from 'react';
import { PackageOperations } from "../lib/package";
import Operation from "./Operation";

type Props = {
  list: PackageOperations;
};

const Component: FC<Props> = ({ list }) => {
  // if no operation, ignore the render
  if (!list || list.length <= 0) {
    return null;
  }

  return (
    <>
      <h2>Operations</h2>
      <p>
        In this section you will find the list of all defined operations for
        this barnard59 package.
      </p>
      {list.map((op, index) => (
        <Operation operation={op} key={index} />
      ))}
    </>
  );
};

export default Component;
