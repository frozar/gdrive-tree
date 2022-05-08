import { findNearestLowerFocusableElement } from "./htmlElement";

const File = ({ node, mustAutofocus }) => {
  return (
    <li
      id={node.id}
      class="py-1"
      onClick={(e) => {
        const childFocusableElement = findNearestLowerFocusableElement(
          e.currentTarget
        );

        childFocusableElement.focus();
        // Handle only double click
        if (e.detail === 2) {
          window.open(node.webViewLink, "_blank").focus();
        }
      }}
    >
      <span
        class="selectable file"
        tabindex="0"
        autofocus={mustAutofocus}
        onClick={() => {
          window.open(node.webViewLink, "_blank").focus();
        }}
      >
        <img src={node.iconLink} />
        <span
          style="margin-left: 4px; margin-right: 2px; white-space: nowrap"
          contenteditable="false"
        >
          {node.name}
        </span>
      </span>
    </li>
  );
};

export default File;
