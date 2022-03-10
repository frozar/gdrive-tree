import Tabs from "./Tabs";
import Tree from "./Tree";

const Main = () => {
  return (
    <main class="transition-transform custom-transition-duration">
      <Tabs />
      <Tree initSwitch="drive" />
    </main>
  );
};

export default Main;
