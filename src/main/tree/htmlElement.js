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
