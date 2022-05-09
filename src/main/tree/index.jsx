import { createEffect, onMount, onCleanup } from "solid-js";

import { tabbable } from "tabbable";

import Node from "./Node";
import { setNodeInStoreById, getNodeById, isFolder } from "./node";
import {
  findNearestLowerFocusableElement,
  findNearestUpperLiWithId,
  getParentElements,
  adjustBodyWidth,
  isElementVisible,
} from "./htmlElement";
import { customTransitionDuration } from "../../globalConstant";
import { store } from "../../index";

const Tree = ({ node }) => {
  let treeContainerRef;
  let treeRef;

  const isRoot = node.id === "root";

  const nodes = () => {
    return node.subNodes;
  };

  const isExpanded = () => {
    return node.isExpanded;
  };

  const height = () => {
    return node.height;
  };

  function findFocusableElement(
    resTabbable,
    indexTabbableElement,
    increment,
    cycle
  ) {
    const indexNextTabbableElement = cycle
      ? (indexTabbableElement + increment).mod(resTabbable.length)
      : Math.max(
          0,
          Math.min(indexTabbableElement + increment, resTabbable.length - 1)
        );
    const nextTabbableElement = resTabbable[indexNextTabbableElement];

    // Check if every parent elements are expanded, so visible
    if (isElementVisible(nextTabbableElement)) {
      return nextTabbableElement;
    } else {
      return findFocusableElement(
        resTabbable,
        indexNextTabbableElement,
        increment,
        cycle
      );
    }
  }

  function getTabbableElement() {
    return tabbable(treeContainerRef);
  }

  function findNextFocusableElement(cycle) {
    const resTabbable = getTabbableElement();
    const indexTabbableElement = resTabbable.indexOf(document.activeElement);
    if (indexTabbableElement === -1) {
      return null;
    }
    return findFocusableElement(resTabbable, indexTabbableElement, +1, cycle);
  }

  function findPreviousFocusableElement(cycle) {
    const resTabbable = getTabbableElement();
    const indexTabbableElement = resTabbable.indexOf(document.activeElement);
    if (indexTabbableElement === -1) {
      return null;
    }
    return findFocusableElement(resTabbable, indexTabbableElement, -1, cycle);
  }

  function handleKeyDown(event) {
    function focusElementIfFound(nextFocusableElement) {
      if (nextFocusableElement === null) {
        return;
      }

      nextFocusableElement.focus();
    }

    if (event.code === "Tab") {
      event.preventDefault();

      const nextFocusableElement =
        event.shiftKey === false
          ? findNextFocusableElement(true)
          : findPreviousFocusableElement(true);

      focusElementIfFound(nextFocusableElement);
    }

    function handleArrowUp(opt) {
      let cycle = true;
      if (opt && typeof opt.cycle === "boolean") {
        cycle = opt.cycle;
      }
      const nextFocusableElement = findPreviousFocusableElement(cycle);
      focusElementIfFound(nextFocusableElement);
    }

    function handleArrowDown(opt) {
      let cycle = true;
      if (opt && typeof opt.cycle === "boolean") {
        cycle = opt.cycle;
      }
      const nextFocusableElement = findNextFocusableElement(cycle);
      focusElementIfFound(nextFocusableElement);
    }

    if (event.code === "ArrowUp") {
      event.preventDefault();

      handleArrowUp();
    }

    if (event.code === "ArrowDown") {
      event.preventDefault();

      handleArrowDown();
    }

    function getActiveNode() {
      const id = findNearestUpperLiWithId(document.activeElement);
      if (id === null) {
        return null;
      }
      return getNodeById(store.nodes.rootNode, id, true);
    }

    if (event.code === "ArrowRight") {
      event.preventDefault();

      const activeNode = getActiveNode();
      if (activeNode === null) {
        return;
      }

      if (isFolder(activeNode) && !activeNode.isExpanded) {
        setNodeInStoreById(activeNode.id, {
          isExpanded: true,
        });
      } else if (isFolder(activeNode)) {
        handleArrowDown();
      }
    }

    if (event.code === "ArrowLeft") {
      event.preventDefault();

      const activeNode = getActiveNode();
      if (activeNode === null) {
        return;
      }

      if (isFolder(activeNode) && activeNode.isExpanded) {
        // Retract the folder
        setNodeInStoreById(activeNode.id, {
          isExpanded: false,
        });
      } else {
        // Focus the parent folder
        const element = document.getElementById(activeNode.id);
        const parentId = findNearestUpperLiWithId(element.parentElement);

        // If no parent is was found, escape
        if (parentId === null) {
          return;
        }

        const parentElement = document.getElementById(parentId);
        const childFocusable = findNearestLowerFocusableElement(parentElement);
        childFocusable.focus();
      }
    }

    if (event.code === "Enter") {
      event.preventDefault();

      const activeNode = getActiveNode();
      if (activeNode === null) {
        return;
      }
      if (isFolder(activeNode)) {
        if (!activeNode.isExpanded) {
          setNodeInStoreById(activeNode.id, {
            isExpanded: true,
          });
        }
      } else {
        window.open(activeNode.webViewLink, "_blank").focus();
      }
    }

    if (event.code === "Space") {
      event.preventDefault();

      const activeNode = getActiveNode();
      if (activeNode === null) {
        return;
      }
      if (isFolder(activeNode)) {
        setNodeInStoreById(id, {
          isExpanded: !activeNode.isExpanded,
        });
      }
    }

    const nbMovePage = 10;

    if (event.code === "PageUp") {
      event.preventDefault();

      for (const _ of Array(nbMovePage).keys()) {
        handleArrowUp({ cycle: false });
      }
    }

    if (event.code === "PageDown") {
      event.preventDefault();

      for (const _ of Array(nbMovePage).keys()) {
        handleArrowDown({ cycle: false });
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
    if (isRoot) {
      treeContainerRef.removeEventListener("keydown", handleKeyDown);
    }
  });

  // Applies the height in the style of the tree container
  //  -> trigger the animation for the height of the container
  createEffect(() => {
    if (!isRoot) {
      treeContainerRef.style["height"] = `${height()}px`;
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

  // Set body width to display an horizontal scroll bar
  createEffect(() => {
    isExpanded();

    if (!isElementVisible(treeContainerRef)) {
      return;
    }

    setTimeout(() => {
      adjustBodyWidth();
    }, customTransitionDuration);
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
              return <Node node={node} mustAutofocus={mustAutofocus} />;
            }}
          </For>
        </ul>
      </div>
    </div>
  );
};

export default Tree;
