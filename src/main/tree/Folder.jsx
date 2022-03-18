import { createSignal, onMount } from "solid-js";

import { getSortedNodesFromDirectory } from "../TreeContainer";
import Tree from "./index";
import SpinningWheel from "../../SpinningWheel";

const ArrowIcon = (props) => {
  const { isExpanded, setIsExpanded, setIsExpanding, id, setSubNodes } = props;

  function toggleExpanded() {
    setIsExpanded((isExpanded) => !isExpanded);
  }

  return (
    <span
      class="arrow-container custom-transition-duration"
      onClick={async (event) => {
        const { currentTarget } = event;
        toggleExpanded();
        if (isExpanded()) {
          currentTarget.classList.add("expand-folder");

          try {
            setIsExpanding(true);
            const nodes = await getSortedNodesFromDirectory(999, "*", id);
            // console.log("nodes", nodes);
            setSubNodes(nodes);
            setIsExpanding(false);
          } catch (error) {
            console.error(error);
            setIsExpanding(false);
          }
        } else {
          currentTarget.classList.remove("expand-folder");
          // setSubNodes([]);
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
  );
};

const Folder = (props) => {
  const { node } = props;
  const { id } = node;

  const [isExpanded, setIsExpanded] = createSignal(false);
  const [isExpanding, setIsExpanding] = createSignal(false);
  const [subNodes, setSubNodes] = createSignal([]);
  const [subNodesFetched, setSubNodesFetched] = createSignal(false);

  const SmallSpinningWheel = () => {
    return <SpinningWheel size="small" className="ml-2" />;
  };

  onMount(async () => {
    const nodes = await getSortedNodesFromDirectory(999, "*", id);
    setSubNodes(nodes);
    setSubNodesFetched(true);
  });

  const classList = () => {
    const classListBase = [];
    // if (isExpanded()) {
    //   classListBase.push("collapse-open");
    // } else {
    //   classListBase.push("collapse-close");
    // }
    return classListBase.join(" ");
  };
  return (
    <li id={node.id} class={classList()}>
      <span
        class="folder-surrounding-span"
        // class="collapse-title p-0 folder-surrounding-span"
        // style="height: auto; min-height: auto;"
      >
        <ArrowIcon
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          setIsExpanding={setIsExpanding}
          id={id}
          setSubNodes={setSubNodes}
        />
        <span class="selectable" tabindex="0">
          <img src={node.iconLink} />
          <span
            style="margin-left: 4px; margin-right: 2px"
            contenteditable="false"
          >
            {node.name}
          </span>
        </span>
        {isExpanding() && <SmallSpinningWheel />}
      </span>
      {subNodesFetched() && (
        <Tree isRoot={false} nodes={subNodes} isExpanded={isExpanded} />
      )}
    </li>
  );
};

export default Folder;
