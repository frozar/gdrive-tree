import { createSignal } from "solid-js";

const Tabs = () => {
  const tabs = ["My Drive", "Shared with me"];
  const [activeTab, setActiveTab] = createSignal(tabs[0]);

  return (
    <div class="tabs">
      <For each={tabs}>
        {(tab, i) => (
          <a
            class={`tab tab-lifted ${activeTab() === tab ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </a>
        )}
      </For>
      <div class="flex-grow tab tab-lifted" style="cursor: default;"></div>
    </div>
  );
};

export default Tabs;
