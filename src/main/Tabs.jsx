import { NavLink } from "solid-app-router";

import { triggerFilesRequest } from "./triggerFilesRequest";

const Tabs = ({
  initSwitch,
  nodes,
  setNodes,
  isNodesInitialised,
  setIsNodesInitialised,
  isLoading,
  setIsLoading,
}) => {
  const tabs = [
    { path: "/", label: "My Drive" },
    { path: "/shared", label: "Shared with me" },
  ];

  return (
    <div class="tabs">
      <For each={tabs}>
        {(tab) => (
          <NavLink
            href={tab.path}
            activeClass="tab-active"
            class="tab tab-lifted"
            end
            onclick={() => {
              console.log("tab.label", tab.label);
              triggerFilesRequest(
                initSwitch,
                nodes,
                setNodes,
                setIsNodesInitialised,
                setIsLoading
              );
            }}
          >
            {tab.label}
          </NavLink>
        )}
      </For>
      <div class="flex-grow tab tab-lifted" style="cursor: default;"></div>
    </div>
  );
};

export default Tabs;
