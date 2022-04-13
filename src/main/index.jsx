import { onMount } from "solid-js";

import Tabs from "./Tabs";
import TreeContainer from "./TreeContainer";
import { Routes, Route } from "solid-app-router";
import { hiddenClass } from "../globalConstant";

const Main = () => {
  const MainContent = ({ initSwitch }) => {
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
        <Tabs initSwitch={initSwitch} />
        <TreeContainer initSwitch={initSwitch} />
      </main>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<MainContent initSwitch="drive" />} />
      <Route path="/shared" element={<MainContent initSwitch="shared" />} />
    </Routes>
  );
};

export default Main;
