import { createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { unwrap } from "solid-js/store";

import { tabbable } from "tabbable";

import Node from "./Node";
import {
  setNodeInStoreById,
  getNodeById,
  isFolder,
  getNodePathById,
} from "./node";
import {
  findParentElementWithPredicat,
  findChildElementWithPredicat,
} from "./htmlElement";
import { store } from "../../index";

const Tree = ({ id }) => {
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

  const height = () => {
    const foundNode = getNodeById(store.nodes.rootNode, id);
    if (foundNode) {
      return foundNode.height;
    } else {
      return 0;
    }
  };

  let treeContainerRef;
  let treeRef;

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

  function findFoccusableElement(
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
    const nereastId = findNearestUpperId(nextTabbableElement);
    if (nereastId === null) {
      return null;
    }
    const nodePath = getNodePathById(store.nodes.rootNode, nereastId);

    // Check if every parent elements are expanded, so visible
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
        increment,
        cycle
      );
    }
  }

  function getTabbableElement() {
    return tabbable(treeContainerRef);
  }

  function findNextFoccusableElement(cycle) {
    const resTabbable = getTabbableElement();
    const indexTabbableElement = resTabbable.indexOf(document.activeElement);
    if (indexTabbableElement === -1) {
      return null;
    }
    return findFoccusableElement(resTabbable, indexTabbableElement, +1, cycle);
  }

  function findPreviousFoccusableElement(cycle) {
    const resTabbable = getTabbableElement();
    const indexTabbableElement = resTabbable.indexOf(document.activeElement);
    if (indexTabbableElement === -1) {
      return null;
    }
    return findFoccusableElement(resTabbable, indexTabbableElement, -1, cycle);
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
          ? findNextFoccusableElement(true)
          : findPreviousFoccusableElement(true);

      focusElementIfFound(nextFoccusableElement);
    }

    function handleArrowUp(opt) {
      let cycle = true;
      if (opt && typeof opt.cycle === "boolean") {
        cycle = opt.cycle;
      }
      const nextFoccusableElement = findPreviousFoccusableElement(cycle);
      focusElementIfFound(nextFoccusableElement);
    }

    function handleArrowDown(opt) {
      let cycle = true;
      if (opt && typeof opt.cycle === "boolean") {
        cycle = opt.cycle;
      }
      // console.log("cycle", cycle);
      const nextFoccusableElement = findNextFoccusableElement(cycle);
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

    if (event.code === "Enter") {
      event.preventDefault();

      const id = findNearestUpperId(document.activeElement);
      if (id === null) {
        return;
      }
      const node = getNodeById(store.nodes.rootNode, id);
      if (isFolder(node)) {
        if (!node.isExpanded) {
          setNodeInStoreById(id, {
            isExpanded: true,
          });
        }
      } else {
        window.open(node.webViewLink, "_blank").focus();
      }
    }

    if (event.code === "Space") {
      event.preventDefault();

      const id = findNearestUpperId(document.activeElement);
      if (id === null) {
        return;
      }

      const node = getNodeById(store.nodes.rootNode, id);
      if (isFolder(node)) {
        setNodeInStoreById(id, {
          isExpanded: !node.isExpanded,
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
