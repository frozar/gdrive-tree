import { getFolderIds, isFolderExpanded, toggleFolderExpansion } from "./tree";

const buttonToggleAll = document.getElementById("toggle_all");

async function expandAll() {
  let folderIds = getFolderIds();
  let hasAtLeastOneExpansion = false;
  let expandAgain;
  do {
    expandAgain = false;
    for (const folderId of folderIds) {
      if (document.getElementById(folderId)) {
        if (!isFolderExpanded(folderId)) {
          await toggleFolderExpansion(folderId);
          expandAgain = true;
          hasAtLeastOneExpansion = true;
        }
      }
    }
    if (expandAgain) {
      folderIds = getFolderIds();
    }
  } while (expandAgain);

  return hasAtLeastOneExpansion;
}

async function reduceAll() {
  let hasAtLeastOneReduction = false;
  let folderIds = getFolderIds();
  let reduceAgain;

  do {
    reduceAgain = false;
    for (const folderId of folderIds) {
      if (document.getElementById(folderId)) {
        if (isFolderExpanded(folderId)) {
          await toggleFolderExpansion(folderId);
          reduceAgain = true;
          hasAtLeastOneReduction = true;
        }
      }
    }
    if (reduceAgain) {
      folderIds = getFolderIds();
    }
  } while (reduceAgain);
  return hasAtLeastOneReduction;
}

buttonToggleAll.addEventListener("click", async function (event) {
  const hasAtLeastOneExpansion = await expandAll();

  // console.log("0 hasAtLeastOneExpansion", hasAtLeastOneExpansion);
  if (!hasAtLeastOneExpansion) {
    const hasAtLeastOneReduction = await reduceAll();
  }
  // console.log("1 hasAtLeastOneExpansion", hasAtLeastOneExpansion);
});
