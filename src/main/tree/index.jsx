import { createSignal, createEffect, onMount, onCleanup } from "solid-js";

import { tabbable } from "tabbable";

import Node from "./Node";
import { setNodeInStoreById } from "./node";

const Tree = (props) => {
  const { nodes, isRoot, isExpanded, setParentHeight } = props;

  const [height, setHeight] = createSignal({ value: 0, overwrite: false });

  let treeContainerRef;
  let treeRef;

  function findParentElementWithPredicat(element, predicat) {
    const parentElement = element.parentElement;
    if (!parentElement) {
      return null;
    }

    if (predicat(parentElement.dataset)) {
      return parentElement;
    } else {
      return findParentElementWithPredicat(parentElement, predicat);
    }
  }

  // TODO : maybe delete the "isExpanded" dataset from the DOM
  function findExpandableParentElement(element) {
    return findParentElementWithPredicat(
      element,
      (dataset) => dataset.isExpanded !== undefined
    );
  }

  function findNodeTypeParentElement(element) {
    return findParentElementWithPredicat(
      element,
      (dataset) => dataset.nodeType !== undefined
    );
  }

  // TODO: check if element is visible
  function findFoccusableElement(resTabbable, indexTabbableElement, increment) {
    const indexNextTabbableElement = (indexTabbableElement + increment).mod(
      resTabbable.length
    );
    const nextTabbableElement = resTabbable[indexNextTabbableElement];
    const parentElement = findExpandableParentElement(nextTabbableElement);

    if (parentElement === null) {
      return null;
    }

    if (parentElement.dataset.isExpanded === "true") {
      return nextTabbableElement;
    } else {
      return findFoccusableElement(
        resTabbable,
        indexNextTabbableElement,
        increment
      );
    }
  }

  function getTabbableElement() {
    return tabbable(treeContainerRef);
  }

  function findNextFoccusableElement() {
    const resTabbable = getTabbableElement();
    const indexTabbableElement = resTabbable.indexOf(document.activeElement);
    if (indexTabbableElement === -1) {
      return null;
    }
    return findFoccusableElement(resTabbable, indexTabbableElement, +1);
  }

  function findPreviousFoccusableElement() {
    const resTabbable = getTabbableElement();
    const indexTabbableElement = resTabbable.indexOf(document.activeElement);
    if (indexTabbableElement === -1) {
      return null;
    }
    return findFoccusableElement(resTabbable, indexTabbableElement, -1);
  }

  function handleKeyDown(event) {
    if (event.code === "Tab") {
      event.preventDefault();

      const nextFoccusableElement =
        event.shiftKey === false
          ? findNextFoccusableElement()
          : findPreviousFoccusableElement();

      if (nextFoccusableElement === null) {
        return;
      }

      nextFoccusableElement.focus();
    }

    if (event.code === "ArrowUp") {
      event.preventDefault();

      const nextFoccusableElement = findPreviousFoccusableElement();

      if (nextFoccusableElement === null) {
        return;
      }

      nextFoccusableElement.focus();
    }

    if (event.code === "ArrowDown") {
      event.preventDefault();

      const nextFoccusableElement = findNextFoccusableElement();

      if (nextFoccusableElement === null) {
        return;
      }

      nextFoccusableElement.focus();
    }

    function setExpand(expandValue) {
      const elementNodeType = findNodeTypeParentElement(document.activeElement);
      const nodeType = elementNodeType.dataset.nodeType;
      // console.log(`nodeType [${nodeType}]`);

      const id = elementNodeType.id;

      // console.log("id", id);

      if (nodeType === "folder") {
        setNodeInStoreById(id, {
          isExpanded: expandValue,
        });
      }
    }

    // TODO : go to the first sub-element if the node is already expanded
    if (event.code === "ArrowRight") {
      event.preventDefault();

      setExpand(true);
    }

    // TODO : go to the parent element if the node is not expanded
    if (event.code === "ArrowLeft") {
      event.preventDefault();

      setExpand(false);
    }
  }

  onMount(() => {
    if (isRoot) {
      const htmlElement = document.getElementsByTagName("html")[0];
      const bodyElement = document.getElementsByTagName("body")[0];
      const appElement = document.getElementById("app");
      const mainElement = document.getElementById("mainContent");
      htmlElement.style.height = "unset";
      bodyElement.style.height = "unset";
      appElement.style.height = "unset";
      mainElement.style.height = "unset";

      treeContainerRef.addEventListener("keydown", handleKeyDown);
      treeRef.style["margin-top"] = "0.5rem";
    }
  });

  onCleanup(() => {
    treeContainerRef.removeEventListener("keydown", handleKeyDown);
  });

  createEffect(() => {
    // console.log("BEF treeContainerRef.dataset", treeContainerRef.dataset);
    if (isRoot) {
      treeContainerRef.dataset.isExpanded = "true";
    } else {
      treeContainerRef.dataset.isExpanded = isExpanded() ? "true" : "false";
      // treeContainerRef.dataset.isExpanded = isExpanded ? "true" : "false";
    }
    // console.log("AFT treeContainerRef.dataset", treeContainerRef.dataset);
  });

  // Update the height signal of this Tree component
  // When the Tree is expanded, the height is updated in two cases:
  // 1. If not overwrite, the content of the tree is taken into account
  // 2. Else, the height of the current tree has been set by a sub-tree
  createEffect(() => {
    if (!isRoot) {
      if (isExpanded()) {
        // if (isExpanded) {
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
        // if (isExpanded) {
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
            {(node, nodeIndex) => {
              const mustAutofocus = isRoot && nodeIndex() === 0;
              return (
                <Node
                  node={node}
                  setHeight={setHeight}
                  isExpanded={isRoot ? () => true : isExpanded}
                  // isExpanded={isRoot ? true : isExpanded}
                  mustAutofocus={mustAutofocus}
                />
              );
            }}
          </For>
        </ul>
      </div>
    </div>
  );
};

export default Tree;
