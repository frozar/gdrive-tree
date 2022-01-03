import show from "./tree";

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (e) => {
    if (e.target.matches("[data-link]")) {
      e.preventDefault();

      // console.log(e.target.href);
      const tokens = e.target.href.split("/");
      const switchToken = tokens[tokens.length - 1];
      // console.log(switchToken);
      show(switchToken);
    }
  });

  // /* Document has loaded -  run the router! */
  // router();
});

export default function router() {
  console.log("router");
}
