import { FC } from 'react';
import Editor from "@monaco-editor/react";
import { PackageOperation } from "../lib/package";

type Props = {
  operation: PackageOperation;
};

const Component: FC<Props> = ({ operation }) => {
  // if no operation or if no label was defined, ignore the render
  if (!operation || !operation.label) {
    return null;
  }

  const label = operation.label;
  const comment = operation.comment;
  const snippet = operation.snippet;

  return (
    <>
      <h3>{label}</h3>
      {comment && <p>{comment}</p>}
      {snippet && (
        <Editor
          options={{
            readOnly: true,
            fontSize: 18,
            wordWrap: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
          theme="vs-dark"
          defaultValue={snippet}
          height="200px"
        />
      )}
    </>
  );
};

export default Component;
