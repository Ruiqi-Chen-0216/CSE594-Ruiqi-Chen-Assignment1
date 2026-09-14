import { createFileRoute } from "@tanstack/react-router";
import { EmotionLabelingApp } from "@/components/emotion-labeling-app";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Emotion Labeling" },
    { name: "description", content: "Label the emotion expressed in five short social media posts." },
    { property: "og:title", content: "Emotion Labeling" },
    { property: "og:description", content: "Label the emotion expressed in five short social media posts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: EmotionLabelingApp,
});
