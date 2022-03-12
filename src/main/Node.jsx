import { createSignal } from "solid-js";

const Folder = (props) => {
  const { node } = props;

  const [isExpanded, setIsExpanded] = createSignal(false);

  function toggleExpanded() {
    setIsExpanded((isExpanded) => !isExpanded);
  }

  return (
    <li id={node.id}>
      <span class="folder-surrounding-span">
        <span
          class="arrow-container custom-transition-duration"
          onClick={(event) => {
            const { currentTarget } = event;
            toggleExpanded();
            if (isExpanded()) {
              currentTarget.classList.add("expand-folder");
            } else {
              currentTarget.classList.remove("expand-folder");
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            width="16px"
            height="16px"
            viewBox="0 -5 25 30"
            aria-hidden="true"
          >
            <path class="arrow" d="m5 20 10 -10 -10 -10 z"></path>
          </svg>
        </span>
        <span class="selectable" tabindex="0">
          <img src={node.iconLink} />
          <span
            style="margin-left: 4px; margin-right: 2px"
            contenteditable="false"
          >
            {node.name}
          </span>
        </span>
      </span>
    </li>
  );
};

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

const Node = (props) => {
  const { node } = props;
  if (node.mimeType === "application/vnd.google-apps.folder") {
    return <Folder node={node} />;
  } else {
    return <File node={node} />;
  }
};

export default Node;
