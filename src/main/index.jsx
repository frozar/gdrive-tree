import Tabs from "./Tabs";
import TreeContainer from "./TreeContainer";

const Main = () => {
  return (
    <main class="transition-transform custom-transition-duration">
      <Tabs />
      <TreeContainer initSwitch="drive" />
    </main>
  );
};

export default Main;
