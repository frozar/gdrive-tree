import { createSignal, createEffect, onMount } from "solid-js";
import Node from "./Node";

const Tree = (props) => {
  const { nodes, isRoot, isExpanded, setParentHeight, name } = props;

  const [height, setHeight] = createSignal({ value: 0, overwrite: false });

  let treeContainerRef;
  let treeRef;

  onMount(() => {
    const htmlElement = document.getElementsByTagName("html")[0];
    const bodyElement = document.getElementsByTagName("body")[0];
    const appElement = document.getElementById("app");
    const mainElement = document.getElementById("mainContent");
    htmlElement.style.height = "unset";
    bodyElement.style.height = "unset";
    appElement.style.height = "unset";
    mainElement.style.height = "unset";
  });

  // Update the height signal of this Tree component
  // When the Tree is expanded, the height is updated in two cases:
  // 1. If not overwrite, the content of the tree is taken into account
  // 2. Else, the height of the current tree has been set by a sub-tree
  createEffect(() => {
    if (!isRoot) {
      if (isExpanded()) {
        if (!height().overwrite) {
          const currentElementHeight = treeRef.getBoundingClientRect().height;
          if (height().value !== currentElementHeight) {
            // console.log("00 name", name);
            // console.log("00 height()", height().value);
            // console.log("00 currentMaxHeight", currentElementHeight);
            setHeight((height) => ({ ...height, value: currentElementHeight }));
            setParentHeight((parentHeight) => ({
              ...parentHeight,
              value: parentHeight.value + currentElementHeight,
              overwrite: true,
            }));
          }
        }
      } else {
        if (height().value !== 0) {
          // console.log("01 name", name);
          // console.log("01 height()", height().value);
          setParentHeight((parentHeight) => ({
            ...parentHeight,
            value: parentHeight.value - height().value,
            overwrite: true,
          }));
          setHeight((height) => ({ ...height, value: 0, overwrite: false }));
        }
      }
    }
  });

  // Applies the height in the style of the tree container
  //  -> trigger the animation for the height of the container
  createEffect(() => {
    if (!isRoot) {
      // console.log("1  height()", height().value);
      treeContainerRef.style["height"] = `${height().value}px`;
    }
  });

  // Applies the correct class to the content of the tree
  // in order to translate it following Y direction
  //  -> trigger the animation for the translation of the tree content
  createEffect(() => {
    if (!isRoot) {
      if (isExpanded()) {
        treeRef.classList.add("tree--open");
      } else {
        treeRef.classList.remove("tree--open");
      }
    }
  });

  return (
    <div
      ref={treeContainerRef}
      class={
        isRoot
          ? "overflow-hidden tree--open"
          : "overflow-hidden tree-container-animation custom-transition-duration"
      }
    >
      <div
        ref={treeRef}
        class={
          isRoot
            ? "custom-transition-duration"
            : "tree custom-transition-duration ml-4"
        }
      >
        <ul>
          <For each={nodes()}>
            {(node) => (
              <Node
                node={node}
                setHeight={setHeight}
                isExpanded={isRoot ? () => true : isExpanded}
              />
            )}
          </For>
        </ul>
      </div>
    </div>
  );
};

export default Tree;
