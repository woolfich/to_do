import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Service Worker регистрируется автоматически через vite-plugin-pwa
// (injectRegister: 'auto' в vite.config.js инжектит <script> в index.html).
// Не дублируем регистрацию здесь — это сломает PWA installability.

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
