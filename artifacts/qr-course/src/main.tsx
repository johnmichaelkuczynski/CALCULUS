import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import { setAiProviderGetter } from "@workspace/api-client-react";

setAiProviderGetter(() => {
  const saved = localStorage.getItem("calculus-ai-provider") ?? localStorage.getItem("economics101-ai-provider");
  return ["gemini", "perplexity", "openai", "claude", "deepseek", "grok"].includes(saved ?? "") ? saved! : "perplexity";
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
