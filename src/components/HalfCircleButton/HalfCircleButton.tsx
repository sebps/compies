import React from "react";
import "./HalfCircleButton.css";
import type { Property } from "csstype";

export type HalfCircleButtonProps = {
  size?: number;
  onClick?: () => void;
  children?: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  primaryColor?: string;
  secondaryColor?: string;
  mode?: "outlined" | "material" | "standard";
  style?: React.CSSProperties; // Add style prop
};

export const HalfCircleButton: React.FC<HalfCircleButtonProps> = ({
  size = 100,
  onClick,
  children,
  direction = "up",
  primaryColor = "#000000",
  secondaryColor = "#efefef",
  mode = "standard",
  style, // Destructure style prop
}) => {
  const borderRadius: string =
    direction === "up"
      ? `${size}px ${size}px 0 0`
      : direction === "down"
      ? `0 0 ${size}px ${size}px`
      : direction === "left"
      ? `${size}px 0 0 ${size}px`
      : `0 ${size}px ${size}px 0`;

  const width = direction === "left" || direction === "right" ? `${size}px` : `${size * 2}px`;
  const height = direction === "up" || direction === "down" ? `${size}px` : `${size * 2}px`;

  const modeStyles =
    mode === "outlined"
      ? {
          border: `2px solid ${primaryColor}`,
          backgroundColor: secondaryColor,
          color: primaryColor,
        }
      : mode === "material"
      ? {
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
          backgroundColor: secondaryColor,
          color: primaryColor,
          position: style?.position || "relative" as Property.Position,
        }
      : {
          backgroundColor: secondaryColor,
          color: primaryColor,
        };

  const pseudoElementStyles =
    mode === "material"
      ? {
          content: '""',
          position: "absolute" as Property.Position,
          top: direction === "up" ? "0" : direction === "down" ? "auto" : "0",
          bottom: direction === "down" ? "0" : "auto",
          left: direction === "left" ? "0" : "auto",
          right: direction === "right" ? "0" : "auto",
          width:
            direction === "up" || direction === "down" ? "100%" : "50%",
          height:
            direction === "left" || direction === "right" ? "100%" : "50%",
          borderRadius: borderRadius,
          zIndex: -1,
        }
      : {};

  return (
    <div
      className="half-circle-button"
      style={{
        width: width,
        height: height,
        borderRadius: borderRadius,
        position: "relative" as Property.Position,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        ...modeStyles,
        ...style, // Merge passed style prop
      }}
      onClick={onClick}
    >
      {mode === "material" && <div style={pseudoElementStyles}></div>}
      <div style={{ position: "relative" as Property.Position, zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default HalfCircleButton;
