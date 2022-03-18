import { createEffect } from "solid-js";
import Node from "./Node";

const Tree = (props) => {
  const { nodes, isRoot, isExpanded } = props;
  let treeContainerRef;
  let treeRef;

  createEffect(() => {
    if (isExpanded && typeof isExpanded === "function") {
      if (isExpanded()) {
        treeRef.classList.add("tree--open");
        if (!isRoot) {
          const domRect = treeRef.getBoundingClientRect();
          treeContainerRef.style["max-height"] = `${domRect.height}px`;
        }
      } else {
        treeRef.classList.remove("tree--open");
        if (!isRoot) {
          treeContainerRef.style["max-height"] = null;
        }
      }
    }
  });

  return (
    <div
      ref={treeContainerRef}
      class={
        isRoot
          ? "overflow-hidden"
          : "overflow-hidden tree-container-animation custom-transition-duration"
      }
    >
      <div
        ref={treeRef}
        class={
          isRoot
            ? "tree custom-transition-duration"
            : "tree custom-transition-duration  ml-4"
        }
      >
        <ul>
          <For each={nodes()}>{(node) => <Node node={node} />}</For>
        </ul>
      </div>
    </div>
  );
};

export default Tree;
