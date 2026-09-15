import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EmotionLabelingApp } from "@/components/emotion-labeling-app";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EmotionLabelingApp />
  </StrictMode>,
);
