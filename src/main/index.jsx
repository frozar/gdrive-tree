import Tabs from "./Tabs";
import TreeContainer from "./TreeContainer";
import { Router, Routes, Route, Link } from "solid-app-router";

const Main = () => {
  // <main class="transition-transform custom-transition-duration">
  {
    /* <Tabs /> */
  }
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main class="transition-transform custom-transition-duration">
            <Tabs />
            <TreeContainer initSwitch="drive" />
          </main>
        }
      />
      <Route
        path="/shared"
        element={
          <main class="transition-transform custom-transition-duration">
            <Tabs />
            <TreeContainer initSwitch="shared" />{" "}
          </main>
        }
      />
    </Routes>
  );
  // </main>
};

export default Main;
