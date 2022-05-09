export function findParentElementWithPredicat(element, predicat) {
  const parentElement = element.parentElement;
  if (!parentElement) {
    return null;
  }

  if (predicat(parentElement)) {
    return parentElement;
  } else {
    return findParentElementWithPredicat(parentElement, predicat);
  }
}

export function findChildElementWithPredicat(element, predicat) {
  const children = element.children;

  for (let i = 0; i < children.length; ++i) {
    const child = children.item(i);
    if (predicat(child)) {
      return child;
    } else {
      const res = findChildElementWithPredicat(child, predicat);
      if (res) {
        return res;
      }
    }
  }

  return null;
}

export function findNearestLowerFocusableElement(element) {
  const childElementWithTabIndex = findChildElementWithPredicat(
    element,
    (element) => element.getAttribute("tabindex") !== null
  );

  if (childElementWithTabIndex) {
    return childElementWithTabIndex;
  } else {
    return new Error(`Cannot find parent id for element ${element}`);
  }
}

export function findNearestUpperLiWithId(element) {
  const parentElementWithId = findParentElementWithPredicat(
    element,
    (element) => element.tagName === "LI" && element.getAttribute("id") !== null
  );

  if (parentElementWithId) {
    return parentElementWithId.getAttribute("id");
  } else {
    console.info("Cannot find parent id for element");
    console.info(element);
    return null;
  }
}

export function getParentElements(element) {
  let currentElt = element.parentElement;
  const listParent = [];
  while (currentElt) {
    listParent.push(currentElt);
    currentElt = currentElt.parentElement;
  }
  return listParent;
}

/**
 * Check if every parent elements are expanded, so visible
 * @param {*} element
 * @returns
 */
export function isElementVisible(element) {
  const listParent = getParentElements(element);
  const isNotVisible = listParent.some((elt) => elt.style.height === "0px");

  return !isNotVisible;
}

export function adjustBodyWidth() {
  // Every node that the width has to be checked
  let listElement = Array.from(
    document.querySelectorAll("span.selectable")
  ).filter((elt) => isElementVisible(elt));

  const maxLineWidth = listElement
    .map((elt) => {
      const rect = elt.getBoundingClientRect();
      const lineWidth = window.pageXOffset + rect.left + rect.width * 1.02;
      return lineWidth;
    })
    .reduce((acc, currentVal) => {
      return Math.max(acc, currentVal);
    }, 0);

  const body = document.body;

  if (window.innerWidth < maxLineWidth) {
    body.style.width = `${maxLineWidth}px`;
  } else {
    body.style.width = "";
  }
}
