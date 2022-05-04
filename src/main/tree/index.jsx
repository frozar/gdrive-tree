import { createSignal, createEffect, onMount, onCleanup } from "solid-js";

import { tabbable } from "tabbable";

import Node from "./Node";
import {
  setNodeInStoreById,
  getNodeById,
  isFolder,
  getNodePathById,
} from "./node";
import { store } from "../../index";

// TODO : erase the 'setParentHeight' function and store the
// height of a node in a richer node.
const Tree = ({ id, setParentHeight }) => {
  const isRoot = id === "root";

  const nodes = () => {
    const node = getNodeById(store.nodes.rootNode, id);
    if (node && node.subNodes) {
      return node.subNodes;
    } else {
      return [];
    }
  };

  const isExpanded = () => {
    const foundNode = getNodeById(store.nodes.rootNode, id);
    if (foundNode) {
      return foundNode.isExpanded;
    } else {
      return false;
    }
  };

  const [height, setHeight] = createSignal({ value: 0, overwrite: false });

  let treeContainerRef;
  let treeRef;

  function findParentElementWithPredicat(element, predicat) {
    const parentElement = element.parentElement;
    if (!parentElement) {
      return null;
    }

    if (predicat(parentElement)) {
      return parentElement;
    } else {
      return findParentElementWithPredicat(parentElement, predicat);
    }
  }

  function findChildElementWithPredicat(element, predicat) {
    const children = element.children;

    for (let i = 0; i < children.length; ++i) {
      const child = children.item(i);
      if (predicat(child)) {
        return child;
      } else {
        const res = findChildElementWithPredicat(child, predicat);
        if (res) {
          return res;
        }
      }
    }

    return null;
  }

  function findNearestLowerFoccusableElement(element) {
    const parentElementWithTabIndex = findChildElementWithPredicat(
      element,
      (element) => element.getAttribute("tabindex") !== null
    );

    if (parentElementWithTabIndex) {
      return parentElementWithTabIndex;
    } else {
      return new Error(`Cannot find parent id for element ${element}`);
    }
  }

  function findNearestUpperId(element) {
    const parentElementWithId = findParentElementWithPredicat(
      element,
      (element) =>
        element.tagName === "LI" && element.getAttribute("id") !== null
    );

    if (parentElementWithId) {
      return parentElementWithId.getAttribute("id");
    } else {
      console.info("Cannot find parent id for element");
      console.info(element);
      return null;
    }
  }

  function findFoccusableElement(resTabbable, indexTabbableElement, increment) {
    const indexNextTabbableElement = (indexTabbableElement + increment).mod(
      resTabbable.length
    );
    const nextTabbableElement = resTabbable[indexNextTabbableElement];
    const nereastId = findNearestUpperId(nextTabbableElement);
    if (nereastId === null) {
      return null;
    }
    const nodePath = getNodePathById(store.nodes.rootNode, nereastId);

    // Check if every parent element is expanded, so visible
    if (
      !nodePath
        .slice(0, nodePath.length - 1)
        .some((n) => n.isExpanded === false)
    ) {
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
    function focusElementIfFound(nextFoccusableElement) {
      if (nextFoccusableElement === null) {
        return;
      }

      nextFoccusableElement.focus();
    }

    if (event.code === "Tab") {
      event.preventDefault();

      const nextFoccusableElement =
        event.shiftKey === false
          ? findNextFoccusableElement()
          : findPreviousFoccusableElement();

      focusElementIfFound(nextFoccusableElement);
    }

    function handleArrowUp() {
      const nextFoccusableElement = findPreviousFoccusableElement();
      focusElementIfFound(nextFoccusableElement);
    }

    function handleArrowDown() {
      const nextFoccusableElement = findNextFoccusableElement();
      focusElementIfFound(nextFoccusableElement);
    }

    if (event.code === "ArrowUp") {
      event.preventDefault();

      handleArrowUp();
    }

    if (event.code === "ArrowDown") {
      event.preventDefault();

      handleArrowDown();
    }

    if (event.code === "ArrowRight") {
      event.preventDefault();

      const id = findNearestUpperId(document.activeElement);
      if (id === null) {
        return;
      }
      const node = getNodeById(store.nodes.rootNode, id);

      if (isFolder(node) && !node.isExpanded) {
        setNodeInStoreById(id, {
          isExpanded: true,
        });
      } else if (isFolder(node)) {
        handleArrowDown();
      }
    }

    if (event.code === "ArrowLeft") {
      event.preventDefault();

      const id = findNearestUpperId(document.activeElement);
      if (id === null) {
        return;
      }
      const node = getNodeById(store.nodes.rootNode, id);

      if (isFolder(node) && node.isExpanded) {
        // Retract the folder
        setNodeInStoreById(id, {
          isExpanded: false,
        });
      } else {
        // Focus the parent folder
        const element = document.getElementById(id);
        const parentId = findNearestUpperId(element.parentElement);

        // If no parent is was found, escape
        if (parentId === null) {
          return;
        }

        const parentElement = document.getElementById(parentId);
        const childFoccusable =
          findNearestLowerFoccusableElement(parentElement);
        childFoccusable.focus();
      }
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
