import { NavLink } from "solid-app-router";
import { onMount } from "solid-js";

import { store } from "../index";
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
  onMount(() => {
    if (store.isInitialised) {
      triggerFilesRequest(
        initSwitch,
        nodes,
        setNodes,
        setIsNodesInitialised,
        setIsLoading
      );
    }
  });

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
