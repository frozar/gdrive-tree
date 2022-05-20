import _ from "lodash";

export function computeObjectUpdatePart(existingObject, updatedObject) {
  const updatePart = {};
  for (const [k, v] of Object.entries(updatedObject)) {
    if (!(k in existingObject)) {
      updatePart[k] = v;
      continue;
    }
    if (!_.isEqual(existingObject[k], updatedObject[k])) {
      if (
        existingObject[k].constructor === Object &&
        updatedObject[k].constructor === Object
      ) {
        const subUpdatePart = computeObjectUpdatePart(
          existingObject[k],
          updatedObject[k]
        );
        if (Object.keys(subUpdatePart).length) {
          updatePart[k] = subUpdatePart;
          continue;
        }
      } else {
        updatePart[k] = v;
        continue;
      }
    }
  }
  return updatePart;
}
