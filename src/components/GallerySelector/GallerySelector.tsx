import React, { useEffect, useRef, useState } from "react";
import "./GallerySelector.css";

export type GallerySelectorProps = {
  elements: any[];
  defaultSelectedIndex?: number;
  position: "left" | "right" | "top" | "bottom";
  theme?: "standard" | "material" | "border";
  gallerySize?: number,
  galleryTheme?:
    | "standard"
    | "rounded"
    | "outlined"
    | "material"
    | "material-rounded"
    | "outlined-rounded";
  onSelect?: (element: any) => void;
  renderSelectedElement?: (element: any) => React.ReactNode;
};

export const GallerySelector: React.FC<GallerySelectorProps> = ({
  elements,
  position,
  theme = "standard",
  galleryTheme = "standard",
  gallerySize = 150,
  defaultSelectedIndex = 0,
  onSelect = (element) => {},
  renderSelectedElement = (element) => (
    <div style={{ textAlign: "center" }}>
      <h1>{element.title}</h1>
      <p>{element.subtitle}</p>
    </div>
  ),
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const isHorizontal = position === "top" || position === "bottom";

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    
    const gallery = galleryRef.current;
    const selectedItem = gallery?.children[index] as HTMLElement | null;
    
    if (gallery && selectedItem) {
      const padding = 10; // Match padding in CSS
      if (isHorizontal) {
        gallery.scrollLeft = selectedItem.offsetLeft - gallery.offsetLeft - padding;
      } else {
        gallery.scrollTop = selectedItem.offsetTop - gallery.offsetTop - padding;
      }
    }

    onSelect(elements[index])
  };

  useEffect(() => {
    if (defaultSelectedIndex > 0) {
      handleSelect(defaultSelectedIndex)
    }
  }, [])

  return (
    <div
      className={`gallery-selector ${
        isHorizontal ? "horizontal" : "vertical"
      } ${theme}`}
    >
      {(position === "left" || position === "top") && (
        <div
          className={`gallery-zone ${isHorizontal ? "horizontal" : "vertical"}`}
          ref={galleryRef}
          // style={{ display: `flex 0 0 ${gallerySize}` }}
        >
          {elements.map((element, index) => (
            <div
              key={index}
              className={`gallery-item ${galleryTheme} ${
                index === selectedIndex ? "selected" : ""
              }`}
              onClick={() => handleSelect(index)}
            >
              <div>
                <h3>{element.title}</h3>
                <p>{element.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="selected-zone">
        {renderSelectedElement(elements[selectedIndex])}
      </div>
      {(position === "right" || position === "bottom") && (
        <div
          className={`gallery-zone ${isHorizontal ? "horizontal" : "vertical"}`}
          ref={galleryRef}
        >
          {elements.map((element, index) => (
            <div
              key={index}
              className={`gallery-item ${galleryTheme} ${
                index === selectedIndex ? "selected" : ""
              }`}
              onClick={() => handleSelect(index)}
            >
              <div>
                <h3>{element.title}</h3>
                <p>{element.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GallerySelector;
