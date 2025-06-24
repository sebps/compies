import React, { useState, useEffect, useRef } from "react";
import "./Terminal.css";

export interface TerminalProps {
  websocketUrl?: string;
  initialContent?: string;
  initialCommands?: string[];
  initialReturns?: (string | null)[]; // If null, the command is executed via onInput or WebSocket
  onInput?: (input: string) => Promise<string>;
  isControlled?: boolean;
  mode?: "controlled" | "standard" | "websocket";
  typingDelay?: number;
  commandDelay?: number;
  websocketDelay?: number; // Delay before WebSocket connection is established
  theme?: "standard" | "material" | "desktop"; // Theme for the terminal
  onconnect?: () => void;
  onclose?: () => void;
  textColor?: string; // Custom text color
  backgroundColor?: string; // Custom background color
}

export const Terminal: React.FC<TerminalProps> = ({
  websocketUrl = "ws://localhost:12345/ws",
  initialContent = "",
  initialCommands = [],
  initialReturns = [],
  onInput,
  isControlled = false,
  mode = "standard",
  typingDelay = 100,
  commandDelay = 500,
  websocketDelay = 0,
  theme = "standard",
  onconnect,
  onclose,
  textColor = "#FFF",
  backgroundColor = "#000",
}) => {
  const [displayedOutput, setDisplayedOutput] = useState<{ prefix?: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [prefix, setPrefix] = useState(mode === "standard" ? "$" : "");
  const outputRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  });

  useEffect(() => {
    setDisplayedOutput([{ content: initialContent }]);

    if (mode === "websocket") {
      const connectWebSocket = async () => {
        if (websocketDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, websocketDelay));
        }

        websocketRef.current = new WebSocket(websocketUrl);

        websocketRef.current.onopen = () => {
          setDisplayedOutput((prev) => [...prev, { content: "WebSocket connection established." }]);
          if (onconnect) onconnect();
        };

        websocketRef.current.onclose = () => {
          setDisplayedOutput((prev) => [...prev, { content: "WebSocket connection closed." }]);
          if (onclose) onclose();
        };

        websocketRef.current.onmessage = (e) => {
          handleWebSocketMessage(e.data);
        };
      };

      connectWebSocket();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [websocketUrl, mode, initialContent, onconnect, onclose, websocketDelay]);

  const handleWebSocketMessage = (message: string) => {
    let buffer = "";
    let outputLines: string[] = [];

    for (let i = 0; i < message.length; i++) {
      const char = message[i];
      const nextChar = message[i + 1];

      if (char === "\r" && nextChar === "\n") {
        outputLines.push(buffer);
        buffer = "";
        i++;
        continue;
      }

      if (char === "\n") {
        outputLines.push(buffer);
        buffer = "";
        continue;
      }

      if (char === "\r") {
        buffer = "";
        continue;
      }

      buffer += char;
    }

    if (buffer) {
      outputLines.push(buffer);
    }

    updateTerminalOutput(outputLines);
  };

  const updateTerminalOutput = (lines: string[]) => {
    setDisplayedOutput((prev) => {
      const updatedOutput = [...prev];

      lines.forEach((line, index) => {
        if (index === lines.length - 1 && !line.includes("\n")) {
          setPrefix(line);
        } else {
          updatedOutput.push({ content: line });
        }
      });

      return updatedOutput;
    });
  };

  const executeCommand = async (command: string) => {
    if (command.trim().toLowerCase() === "clear") {
      setDisplayedOutput([]);
      setInput("");
      return;
    }

    setDisplayedOutput((prev) => [...prev, { prefix, content: command }]);
    setInput("");

    if (mode === "websocket" && websocketRef.current) {
      websocketRef.current.send(command + "\n");
    } else if (onInput) {
      const result = await onInput(command);
      setDisplayedOutput((prev) => [...prev, { content: result }]);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const processInitialCommands = async () => {
    for (let i = 0; i < initialCommands.length; i++) {
      const command = initialCommands[i];
      const returnValue = initialReturns[i];

      // Simulate typing the command character by character
      for (let j = 0; j < command.length; j++) {
        setInput((prev) => prev + command[j]);
        await new Promise((resolve) => setTimeout(resolve, typingDelay));
      }

      // Execute the command
      if (returnValue !== null) {
        setDisplayedOutput((prev) => [...prev, { prefix, content: command }, { content: returnValue }]);
      } else {
        await executeCommand(command);
      }

      setInput(""); // Clear the input
      await new Promise((resolve) => setTimeout(resolve, commandDelay)); // Wait before typing the next command
    }
  };

  useEffect(() => {
    if (initialCommands.length > 0) {
      processInitialCommands();
    }
  }, [initialCommands, initialReturns, typingDelay, commandDelay]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayedOutput]);

  return (
    <div
      className={`terminal-container ${theme === "desktop" ? "desktop-frame" : ""}`}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {/* Desktop-style frame */}
      {theme === "desktop" && (
        <div className="desktop-header">
          <span className="desktop-button red"></span>
          <span className="desktop-button yellow"></span>
          <span className="desktop-button green"></span>
        </div>
      )}

      <div
        className="terminal"
        ref={outputRef}
        style={{
          backgroundColor,
          color: textColor,
        }}
      >
        {displayedOutput.map((line, index) => (
          <div
            key={index}
            className="terminal-output"
            style={{
              color: textColor,
            }}
          >
            {line.prefix && (
              <span
                className="terminal-prefix"
                style={{
                  color: textColor,
                }}
              >
                {line.prefix}
              </span>
            )}
            {line.content}
          </div>
        ))}
        <div className="terminal-input-wrapper">
          {prefix && (
            <span
              className="terminal-prefix"
              style={{
                color: textColor,
              }}
            >
              {prefix}
            </span>
          )}
          <input
            ref={inputRef}
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                executeCommand(input.trim());
              }
            }}
            style={{
              color: textColor,
              backgroundColor: "transparent",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;
