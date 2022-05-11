import File from "./File";
import Folder from "./Folder";
import { isFolder } from "./node";

const Node = ({ node, mustAutofocus }) => {
  if (isFolder(node)) {
    return <Folder node={node} mustAutofocus={mustAutofocus} />;
  } else {
    return <File node={node} mustAutofocus={mustAutofocus} />;
  }
};

export default Node;
