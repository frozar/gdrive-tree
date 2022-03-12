const File = (props) => {
  const { node } = props;
  return (
    <li id={node.id}>
      <span class="selectable file" tabindex="0">
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
