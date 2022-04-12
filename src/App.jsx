import Header from "./header";
import Main from "./main";
import { useNavigate, useLocation } from "solid-app-router";

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // console.log("App navigate", navigate);
  // console.log("App location", location);

  if (location.pathname === "/index.html") {
    navigate("/", { replace: true });
  }

  return (
    <>
      <Header />
      <Main />
    </>
  );
};

export default App;
