import File from "./File";
import Folder from "./Folder";

const Node = (props) => {
  const { node, setHeight, isExpanded } = props;
  if (node.mimeType === "application/vnd.google-apps.folder") {
    return (
      <Folder
        node={node}
        setParentHeight={setHeight}
        isParentExpanded={isExpanded}
      />
    );
  } else {
    return <File node={node} />;
  }
};

export default Node;
