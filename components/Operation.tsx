import { PackageOperation } from "../lib/package";

type Props = {
  operation: PackageOperation;
};

const Component: React.FC<Props> = ({ operation }) => {
  // if no operation or if no label was defined, ignore the render
  if (!operation || !operation.label) {
    return null;
  }

  const label = operation.label;
  const comment = operation.comment;

  return (
    <>
      <h3>{label}</h3>
      {comment && <p>{comment}</p>}
    </>
  );
};

export default Component;
