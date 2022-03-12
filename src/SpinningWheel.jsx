const SpinningWheel = (props) => {
  const { size, className } = props;
  console.assert(size !== undefined, { size });
  let classNameArray = [];
  if (className) {
    classNameArray = className.split(" ");
  }
  let classList = classNameArray.concat(["lds-hourglass"]);
  switch (size) {
    case "small": {
      classList.push("lds-hourglass-small");
      break;
    }
    case "big": {
      classList.push("lds-hourglass-big");
      break;
    }
  }
  classList = classList.join(" ");
  return <div class={classList}></div>;
};

export default SpinningWheel;
