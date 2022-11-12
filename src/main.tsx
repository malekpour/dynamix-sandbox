import "./main.css";

import React from "react";
import ReactDOM from "react-dom/client";

import { MobxView } from "./mobx/view";

import sample from "./sample.json";

function App() {
  return <MobxView view={sample.view} model={sample.model} />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
