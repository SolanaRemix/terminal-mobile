import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { injectTheme } from "./design/theme";
import "./design/global.css";

injectTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
