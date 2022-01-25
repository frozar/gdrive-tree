import SelectionArea from "@viselect/vanilla";

export let selectionDone = false;

export function clearSelection() {
  selection.clearSelection();
  for (const node of document.querySelectorAll(".selected")) {
    node.classList.remove("selected");
  }
}

export function resetSelectionDone() {
  selectionDone = false;
}

function generateSelectables(nbRepitition) {
  const pattern = "> div > div ";
  let expandedPattern = "";
  for (let i = 0; i < nbRepitition; ++i) {
    expandedPattern += pattern;
  }
  const prepend = "#container ";
  const append = "> span";
  return prepend + expandedPattern + append;
}

function hasAncestorWithTagName(node, givenTagName) {
  if (node) {
    if (node.tagName === givenTagName) {
      return true;
    } else {
      return hasAncestorWithTag(node.parentElement, givenTagName);
    }
  } else {
    return false;
  }
}

export function nodeIsSelected(node) {
  return node.classList.contains("selected");
}

export const selection = new SelectionArea({
  // Class for the selection-area itself (the element).
  selectionAreaClass: "selection-area",

  // // Class for the selection-area container.
  // selectionContainerClass: "selection-area-container",

  // // Query selector or dom-node to set up container for the selection-area element.
  // container: "body",
  container: "main",

  // // document object - if you want to use it within an embed document (or iframe).
  // document: window.document,

  // Query selectors for elements which can be selected.
  // selectables: [...Array(32).keys()].map((i) => generateSelectables(i)),
  selectables: [".selectable"],

  // // Query selectors for elements from where a selection can be started from.
  // startareas: ["html"],

  // Query selectors for elements which will be used as boundaries for the selection.
  // boundaries: [".container > div"],
  // boundaries: ["#container"],
  boundaries: ["main"],

  // Behaviour related options.
  behaviour: {
    // Specifies what should be done if already selected elements get selected again.
    //   invert: Invert selection for elements which were already selected
    //   keep: Keep selected elements (use clearSelection() to remove those)
    //   drop: Remove stored elements after they have been touched
    //overlap: "invert",

    // On which point an element should be selected.
    // Available modes are cover (cover the entire element), center (touch the center) or
    // the default mode is touch (just touching it).
    // intersect: "touch",

    // px, how many pixels the point should move before starting the selection (combined distance).
    // Or specifiy the threshold for each axis by passing an object like {x: <number>, y: <number>}.
    startThreshold: 10,

    // Scroll configuration.
    scrolling: {
      // On scrollable areas the number on px per frame is devided by this amount.
      // Default is 10 to provide a enjoyable scroll experience.
      speedDivider: 10,

      // Browsers handle mouse-wheel events differently, this number will be used as
      // numerator to calculate the mount of px while scrolling manually: manualScrollSpeed / scrollSpeedDivider.
      manualSpeed: 750,

      // This property defines the virtual inset margins from the borders of the container
      // component that, when crossed by the mouse/touch, trigger the scrolling. Useful for
      // fullscreen containers.
      startScrollMargins: { x: 0, y: 0 },
    },
  },

  // // Features.
  // features: {
  //   // Enable / disable touch support.
  //   touch: true,

  //   // Range selection.
  //   range: true,

  //   // Configuration in case a selectable gets just clicked.
  //   singleTap: {
  //     // Enable single-click selection (Also disables range-selection via shift + ctrl).
  //     allow: true,

  //     // 'native' (element was mouse-event target) or 'touch' (element visually touched).
  //     intersect: "native",
  //   },
  // },
})
  // .on("beforestart", (evt) => {
  //   // Use this event to decide whether a selection should take place or not.
  //   // For example if the user should be able to normally interact with input-elements you
  //   // may want to prevent a selection if the user clicks such a element:
  //   // selection.on('beforestart', ({event}) => {
  //   //   return event.target.tagName !== 'INPUT'; // Returning false prevents a selection
  //   // });

  //   // console.log("beforestart", evt);
  //   // console.log("evt.event.target", evt.event.target);
  //   console.log("evt", evt);
  //   console.log("evt.selection", evt.selection);
  //   // console.log(
  //   //   "iteration",
  //   //   evt.event.target.parentElement.parentElement.parentElement.parentElement
  //   //     .parentElement.parentElement.parentElement.parentElement.parentElement
  //   // );

  //   // let hasSvgAsAncetor = false;
  //   // let currentNode = evt.event.target;
  //   // while (currentNode) {
  //   //   if (currentNode.tagName === "svg") {
  //   //     hasSvgAsAncetor = true;
  //   //     break;
  //   //   }
  //   //   currentNode = currentNode.parentElement;
  //   // }

  //   const hasSvgAsAncetor = hasAncestorWithTag(evt.event.target, "svg");
  //   // console.log("hasSvgAsAncetor", hasSvgAsAncetor);
  //   // console.log("evt.event.target.tagName", evt.event.target.tagName);
  //   // if (evt.event.target.tagName === "svg") {
  //   if (hasSvgAsAncetor) {
  //     console.log("start on svg");
  //     // evt.selection.cancel();
  //     // evt.selection.clearSelection();
  //     // evt.selection.deselect();
  //     // evt.selection.destroy();
  //     // evt.selection.disable();
  //     // return false;
  //   }
  // })
  .on("start", ({ store, event }) => {
    if (!event.ctrlKey && !event.metaKey) {
      for (const el of store.stored) {
        el.classList.remove("selected");
      }

      selection.clearSelection();
    }
  })
  .on(
    "move",
    ({
      store: {
        changed: { added, removed },
      },
    }) => {
      // console.log("move");
      // console.log(added);
      // console.log(removed);
      for (const el of added) {
        el.classList.add("selected");
      }

      for (const el of removed) {
        el.classList.remove("selected");
      }
    }
  )
  // .on("stop", ({ store: { stored } }) => console.log(stored.length));
  .on("stop", (event) => {
    // console.log("event", event);
    // console.log("event.store", event.store);
    // const selected = event.store.selected;
    // console.log(selected);
    // console.log(
    //   "event.store.stored.length + event.store.selected.length",
    //   event.store.stored.length + event.store.selected.length
    // );
    selectionDone =
      event.store.stored.length + event.store.selected.length !== 0;
  });
