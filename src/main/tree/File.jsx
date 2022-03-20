const File = (props) => {
  const { node } = props;
  return (
    <li id={node.id} class="py-1">
      <span
        class="selectable file"
        tabindex="0"
        onClick={(e) => {
          // Handle only double click
          if (e.detail === 2) {
            window.open(node.webViewLink, "_blank").focus();
          }
        }}
      >
        <img src={node.iconLink} />
        <span
          style="margin-left: 4px; margin-right: 2px"
          contenteditable="false"
        >
          {node.name}
        </span>
      </span>
    </li>
  );
};

export default File;
