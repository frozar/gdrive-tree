import Node from "./Node";

const Tree = (props) => {
  const { nodes, hasMargin } = props;

  const classList = hasMargin ? "ml-4" : "";
  return (
    <ul class={classList}>
      <For each={nodes()}>{(node) => <Node node={node} />}</For>
    </ul>
  );
};

export default Tree;
