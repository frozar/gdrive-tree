import { createSignal } from "solid-js";

import File from "./File";
import Folder from "./Folder";

const Node = (props) => {
  const { node } = props;
  if (node.mimeType === "application/vnd.google-apps.folder") {
    return <Folder node={node} />;
  } else {
    return <File node={node} />;
  }
};

export default Node;
