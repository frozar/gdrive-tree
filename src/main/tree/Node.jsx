import File from "./File";
import Folder from "./Folder";

const Node = ({ node, setHeight, isExpanded, mustAutofocus }) => {
  if (node.mimeType === "application/vnd.google-apps.folder") {
    return (
      <Folder
        node={node}
        setParentHeight={setHeight}
        isParentExpanded={isExpanded}
        mustAutofocus={mustAutofocus}
      />
    );
  } else {
    return <File node={node} mustAutofocus={mustAutofocus} />;
  }
};

export default Node;
