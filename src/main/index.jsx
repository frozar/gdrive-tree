import Tabs from "./Tabs";
import Tree from "./Tree";

const Main = () => {
  return (
    <main class="transition-transform" style="transition-duration: 300ms;">
      <Tabs />
      <Tree initSwitch="drive" />
    </main>
  );
};

export default Main;
