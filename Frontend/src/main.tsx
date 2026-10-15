import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/manrope";
import "react-day-picker/style.css";
import "./styles/index.css";
import { App } from "./app/App";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
