import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "D2D Next Level AI",
    short_name: "NLE D2D",
    description: "Kokpit audytorów, handlowców i managerów Next Level Energy",
    start_url: "/kokpit",
    display: "standalone",
    orientation: "any",
    background_color: "#0A0A0D",
    theme_color: "#0A0A0D",
    lang: "pl",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
