import { createSignal, createEffect, onMount, onCleanup } from "solid-js";

import { getSortedNodesFromDirectory } from "../triggerFilesRequest";
import Tree from "./index";
import { setNodeById, getRicherNodes, getNodePathByNode } from "./node";
import {
  findChildElementWithPredicat,
  findNearestLowerFocusableElement,
  findNearestUpperLiWithId,
  adjustBodyWidth,
} from "./htmlElement";

import SpinningWheel from "../../SpinningWheel";
import { customTransitionDuration } from "../../globalConstant";

// TODO: use solidjs-icon librairy
const ArrowIcon = ({ node, toggleExpanded }) => {
  const isExpanded = () => {
    return node.isExpanded;
  };

  let arrowRef;

  function addClassIfExpanded(isExpanded) {
    if (isExpanded) {
      arrowRef.classList.add("expand-folder");
    } else {
      arrowRef.classList.remove("expand-folder");
    }
  }

  function handleClickArrow() {
    toggleExpanded();
  }

  createEffect(() => {
    addClassIfExpanded(isExpanded());
  });

  onMount(() => {
    arrowRef.addEventListener("click", handleClickArrow);
  });

  onCleanup(() => {
    arrowRef.removeEventListener("click", handleClickArrow);
  });

  return (
    <span ref={arrowRef} class="arrow-container custom-transition-duration">
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
  );
};

async function fetchSubNodes(node, fetchState, setFetchState) {
  if (fetchState() !== "done") {
    try {
      setFetchState("running");
      // TODO : enbedded deeper the call to the getRicherNodes() function
      const nodes = await getSortedNodesFromDirectory(999, "*", node.id);
      const richerNodes = getRicherNodes(nodes, node);

      setNodeById(node.id, { subNodes: richerNodes });

      setFetchState("done");
    } catch (error) {
      console.error(error);
      setFetchState("failed");
    }
  }
}

const Folder = ({ node, setParentHeight, mustAutofocus }) => {
  const [fetchState, setFetchState] = createSignal("init");

  const SmallSpinningWheel = () => {
    return <SpinningWheel size="small" className="ml-2" />;
  };

  function toggleExpanded() {
    setNodeById(node.id, { isExpanded: !node.isExpanded });
  }

  createEffect(() => {
    const verbose = false;
    function getTreeRef(id) {
      const parentLi = document.getElementById(id);
      if (verbose) {
        console.log("id", id);
        console.log("parentLi", parentLi);
      }
      if (parentLi === null) {
        return null;
      }
      const childUl = findChildElementWithPredicat(
        parentLi,
        (element) => element.tagName === "UL"
      );
      if (verbose) {
        console.log("childUl", childUl);
        if (childUl !== null) {
          console.log("childUl.parentElement", childUl.parentElement);
        }
      }
      if (childUl === null) {
        return null;
      }

      return childUl.parentElement;
    }

    function setNodeHeight(node, toExpand) {
      const treeRef = getTreeRef(node.id);
      if (treeRef === null) {
        return null;
      }
      const currentElementHeight = treeRef.getBoundingClientRect().height;
      // The 'heightOffset' gives enough space to avoid the focus border
      // to be cropped on the last element of a folder.
      const heightOffset = 3;
      const heightToSet = currentElementHeight + heightOffset;

      let hasUpdated = false;
      if (node.height === 0 && toExpand) {
        setNodeById(node.id, { height: heightToSet });
        hasUpdated = true;
      } else if (node.height !== 0 && !toExpand) {
        setNodeById(node.id, { height: 0 });
        hasUpdated = true;
      }

      return [hasUpdated, heightToSet];
    }

    function updateNodeHeight(id, incrementHeight) {
      const treeRef = getTreeRef(id);
      if (treeRef === null) {
        return;
      }

      setNodeById(id, (obj) => ({
        height: obj.height + incrementHeight,
      }));
    }

    const res = setNodeHeight(node, node.isExpanded);

    if (res === null) {
      return;
    }

    const nodePath = getNodePathByNode(node);
    // Delete the current node and the root node from nodePath
    nodePath.pop();
    nodePath.shift();

    const [hasUpdated, startNodeHeight] = res;
    if (hasUpdated) {
      while (nodePath.length) {
        const currentNode = nodePath.pop();
        updateNodeHeight(
          currentNode.id,
          node.isExpanded ? startNodeHeight : -startNodeHeight
        );
      }
    }
  });

  const isParentExpanded = () => {
    return node.parentNode.isExpanded;
  };

  // Fetch only if the parent tree has been expanded once.
  createEffect(() => {
    if (isParentExpanded()) {
      fetchSubNodes(node, fetchState, setFetchState);
    }
  });

  let nameRef;
  let nameContentRef;

  function handleClickName(e) {
    // Handle only double click
    if (e.detail === 2) {
      toggleExpanded();
    }
  }

  function handleFocus(e) {
    setTimeout(() => {
      adjustBodyWidth();
    }, customTransitionDuration);
  }

  function handleBlur(e) {
    setTimeout(() => {
      adjustBodyWidth();
    }, customTransitionDuration);
  }

  onMount(() => {
    nameRef.addEventListener("click", handleClickName);
    nameRef.addEventListener("focus", handleFocus);
    nameRef.addEventListener("blur", handleBlur);
  });

  onCleanup(() => {
    nameRef.removeEventListener("click", handleClickName);
    nameRef.removeEventListener("focus", handleFocus);
    nameRef.removeEventListener("blur", handleBlur);
  });

  return (
    <li
      id={node.id}
      class="pt-1"
      onClick={(e) => {
        let currentElement = null;
        if (e.target.tagName === "LI" && e.target.getAttribute("id") !== null) {
          currentElement = e.target;
        } else {
          currentElement = findNearestUpperLiWithId(e.target);
        }

        if (currentElement === null) {
          return;
        }

        if (currentElement !== e.currentTarget) {
          return;
        }

        const childFocusableElement = findNearestLowerFocusableElement(
          e.currentTarget
        );

        if (document.activeElement !== childFocusableElement) {
          childFocusableElement.focus();
        }

        if (e.detail === 2) {
          toggleExpanded();
        }
        // TODO : handle case if it's a cell phone that make the 'click'.
        //        maybe a 'tap' event is available
      }}
    >
      <span class="folder-surrounding-span">
        <ArrowIcon node={node} toggleExpanded={toggleExpanded} />
        <span
          class="selectable"
          tabindex="0"
          autofocus={mustAutofocus}
          ref={nameRef}
          onClick={(e) => {
            if (e.detail === 2) {
              toggleExpanded();
            }
          }}
        >
          <img
            src={node.iconLink}
            onerror={(event) => {
              const currentImage = event.currentTarget;
              console.info("First image load failed", currentImage.src);

              // To prevent this from being executed over and over
              currentImage.onerror = (event) => {
                const currentImage = event.currentTarget;
                console.error("Second image load failed", currentImage.src);
                currentImage.onerror = null;
                currentImage.src = currentImage.src;
              };

              // Refresh the src attribute, which should make the
              // browsers reload the iamge.
              currentImage.src = currentImage.src;
            }}
          />
          <span
            ref={nameContentRef}
            class="nameContent"
            style={fetchState() === "failed" ? "color: red" : ""}
            contenteditable="false"
          >
            {node.name}
          </span>
        </span>
        {fetchState() === "running" && <SmallSpinningWheel />}
      </span>
      {fetchState() === "done" && (
        <Tree node={node} setParentHeight={setParentHeight} />
      )}
    </li>
  );
};

export default Folder;
