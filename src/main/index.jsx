import { createSignal, onMount } from "solid-js";

import Tabs from "./Tabs";
import TreeContainer from "./TreeContainer";
import { Routes, Route } from "solid-app-router";
import { hiddenClass } from "../globalConstant";

const Main = () => {
  const MainContent = ({
    initSwitch,
    nodes,
    setNodes,
    isNodesInitialised,
    setIsNodesInitialised,
    isLoading,
    setIsLoading,
  }) => {
    let refMain;

    onMount(() => {
      const headerElement = document.getElementById("topBar");
      const mainElement = refMain;

      if (headerElement) {
        if (headerElement.classList.contains(hiddenClass)) {
          mainElement.classList.add(hiddenClass);
        } else {
          mainElement.classList.remove(hiddenClass);
        }
      }
    });

    return (
      <main
        ref={refMain}
        id="mainContent"
        class="transition-transform custom-transition-duration"
      >
        <Tabs
          initSwitch={initSwitch}
          nodes={nodes}
          setNodes={setNodes}
          isNodesInitialised={isNodesInitialised}
          setIsNodesInitialised={setIsNodesInitialised}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
        <TreeContainer
          initSwitch={initSwitch}
          nodes={nodes}
          setNodes={setNodes}
          isNodesInitialised={isNodesInitialised}
          setIsNodesInitialised={setIsNodesInitialised}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </main>
    );
  };

  const [nodes, setNodes] = createSignal([]);
  const [isNodesInitialised, setIsNodesInitialised] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainContent
            initSwitch="drive"
            nodes={nodes}
            setNodes={setNodes}
            isNodesInitialised={isNodesInitialised}
            setIsNodesInitialised={setIsNodesInitialised}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        }
      />
      <Route
        path="/shared"
        element={
          <MainContent
            initSwitch="shared"
            nodes={nodes}
            setNodes={setNodes}
            isNodesInitialised={isNodesInitialised}
            setIsNodesInitialised={setIsNodesInitialised}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        }
      />
    </Routes>
  );
};

export default Main;
