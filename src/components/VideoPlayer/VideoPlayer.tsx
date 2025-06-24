import React, { useRef, useState, useEffect } from "react";
import "./VideoPlayer.css";

export type Theme = "standard" | "material";

export interface VideoPlayerProps {
  videoUrls: string[]; // List of video URLs
  autoplay?: boolean; // Autoplay the videos
  videoDelay?: number; // Delay before switching videos
  theme?: Theme; // Theme: "standard" or "material"
  controlsBackground?: string; // Background color for the controls section
  loop?: boolean; // Whether videos loop automatically
  pictureInPicture?: boolean; // Whether PiP mode is available
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrls = [], // Default to an empty array to avoid errors
  autoplay = false,
  videoDelay = 2000,
  theme = "standard",
  controlsBackground = "#F5F5F5", // Default background color for controls
  loop = false, // Default loop behavior is off
  pictureInPicture = false, // Default to allow PiP mode
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleLoadedData = () => {
      setIsLoading(false);
      if (autoplay && videoRef.current) {
        videoRef.current.play(); // Automatically play the video after it loads
      }
    };

    const handleEnded = () => {
      if (loop) {
        const nextIndex = currentIndex < videoUrls.length - 1 ? currentIndex + 1 : 0; // Transition to the next or loop back
        switchVideo(nextIndex);
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("ended", handleEnded); // Trigger when the video ends
    }

    return () => {
      if (video) {
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("ended", handleEnded);
      }
    };
  }, [autoplay, loop, currentIndex, videoUrls]);

  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        playVideo();
      } else {
        pauseVideo();
      }
    }
  };

  const switchVideo = (nextIndex: number) => {
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = ""; // Clear the source for black screen
    }

    setTimeout(() => {
      setCurrentIndex(nextIndex);
      if (videoRef.current) {
        videoRef.current.src = videoUrls[nextIndex];
        if (autoplay) {
          videoRef.current.play(); // Automatically play the new video if autoplay is true
        }
      }
      setIsLoading(false);
    }, videoDelay); // Add the delay before loading the next video
  };

  const playNext = () => {
    if (currentIndex < videoUrls.length - 1) {
      switchVideo(currentIndex + 1);
    } else if (loop) {
      switchVideo(0); // Loop back to the first video
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      switchVideo(currentIndex - 1);
    }
  };

  const togglePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture(); // Exit PiP mode if already active
        } else {
          await videoRef.current.requestPictureInPicture(); // Enter PiP mode
        }
      } catch (error) {
        console.error("Error toggling Picture-in-Picture mode:", error);
      }
    }
  };

  const wrapperClass = `video-container ${theme === "material" ? "material" : ""}`;
  const buttonClass = `button ${theme === "material" ? "material" : ""}`;
  const pipButtonClass = `pip-button ${theme === "material" ? "material" : ""}`;

  return (
    <div className={wrapperClass}>
      <div className="video-zone">
        {isLoading && (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        )}
        {videoUrls.length > 0 ? (
          <video
            ref={videoRef}
            src={videoUrls[currentIndex]}
            autoPlay={autoplay}
            controls={false}
            style={{ visibility: isLoading ? "hidden" : "visible" }}
          />
        ) : (
          <div className="no-videos-message">No videos available</div>
        )}
      </div>
      <div
        className="controls"
        style={{
          backgroundColor: controlsBackground, // Dynamically apply background color
        }}
      >
        <div className="main-controls">
          <button
            className={buttonClass}
            onClick={playPrevious}
            disabled={currentIndex === 0 || isLoading}
          >
            &#9664;
          </button>
          <button
            className={buttonClass}
            onClick={togglePlayPause}
            disabled={isLoading}
          >
            &#9654;/&#10073;&#10073;
          </button>
          <button
            className={buttonClass}
            onClick={playNext}
            disabled={currentIndex === videoUrls.length - 1 && !loop || isLoading}
          >
            &#9654;
          </button>
        </div>
        {pictureInPicture && ( // Render PiP button only if PiP is enabled
          <button
            className={pipButtonClass}
            onClick={togglePictureInPicture}
            disabled={isLoading}
            title="Toggle Picture-in-Picture"
          >
            ▣
          </button>
        )}
      </div>
    </div>
  );
};
