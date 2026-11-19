import { loadFont } from "@remotion/google-fonts/Righteous";

const { fontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export const FONT = fontFamily;

// Shazam-inspired palette, pushed darker.
export const COLORS = {
  bgTop: "#0B2A6B",
  bgBottom: "#030817",
  accent: "#1A8CFF",
  accentLight: "#5CC8FF",
  text: "#FFFFFF",
  textDim: "#9DB4D9",
  card: "#0F1E42",
  success: "#3DDC97",
  danger: "#FF5A6E",
};

export const BACKGROUND = `radial-gradient(circle at 50% 30%, ${COLORS.bgTop} 0%, ${COLORS.bgBottom} 75%)`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
