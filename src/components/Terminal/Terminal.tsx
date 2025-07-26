import React, { useState, useEffect, useRef } from "react";
import "./Terminal.css";

export interface TerminalProps {
  websocketUrl?: string;
  sseUrl?: string;
  sseMethod?: string;
  sseCommandParam?: string;
  sseContentType?: string;
  initialContent?: string;
  initialCommands?: string[];
  initialReturns?: (string | null)[];
  onInput?: (input: string) => Promise<string>;
  mode?: "controlled" | "standard" | "websocket" | "sse";
  controlledOutput?: { prefix?: string; content: string }[];
  typingDelay?: number;
  commandDelay?: number;
  websocketDelay?: number;
  theme?: "standard" | "material" | "desktop";
  onconnect?: () => void;
  onclose?: () => void;
  textColor?: string;
  backgroundColor?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  websocketUrl = "ws://localhost:12345/ws",
  sseUrl = "http://localhost:12345/sse",
  sseMethod = "GET",
  sseCommandParam = "cmd",
  sseContentType = "application/json",
  initialContent = "",
  initialCommands = [],
  initialReturns = [],
  onInput,
  mode = "standard",
  controlledOutput = [],
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
  const [inputLines, setInputLines] = useState<string[]>([""]);
  const [printedLineCount, setPrintedLineCount] = useState(0);
  const [wsPrompt, setWsPrompt] = useState<string>("");

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const hasInitializedRef = useRef(false);

  const showInput = mode !== "controlled";
  const getPrompt = (index: number) =>
    mode === "websocket" ? wsPrompt : index === 0 ? "$" : ">";

  // Scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayedOutput]);

  // WebSocket or controlled init (run once)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (initialContent) {
      setDisplayedOutput([{ content: initialContent }]);
    }

    if (mode === "controlled") return;

    if (mode === "websocket") {
      const connect = async () => {
        if (websocketDelay > 0) {
          await new Promise((r) => setTimeout(r, websocketDelay));
        }

        const ws = new WebSocket(websocketUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
          setDisplayedOutput((prev) => [...prev, { content: "WebSocket connection established." }]);
          onconnect?.();
        };

        ws.onclose = () => {
          setDisplayedOutput((prev) => [...prev, { content: "WebSocket connection closed." }]);
          onclose?.();
        };

        ws.onmessage = (e) => {
          const msg = e.data;
          const lines = msg.split("\n");
          const last = lines.pop() ?? "";
          const output = lines.map((l:string) => ({ content: l }));
          if (output.length) {
            setDisplayedOutput((prev) => [...prev, ...output]);
          }
          setWsPrompt(last);
        };
      };

      connect();
    }

    return () => {
      websocketRef.current?.close();
    };
  }, [mode]);

  // Controlled output update
  useEffect(() => {
    if (mode === "controlled") {
      setDisplayedOutput((prev) => {
        const newItems = controlledOutput.slice(prev.length);
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
    }
  }, [controlledOutput, mode]);

  // Run initial commands (typing animation)
  useEffect(() => {
    if (!initialCommands.length || mode === "controlled") return;

    const runInitialCommands = async () => {
      for (let i = 0; i < initialCommands.length; i++) {
        const cmd = initialCommands[i];
        const ret = initialReturns[i];

        for (let j = 0; j < cmd.length; j++) {
          setInputLines([cmd.slice(0, j + 1)]);
          await new Promise((r) => setTimeout(r, typingDelay));
        }

        if (ret !== null) {
          setDisplayedOutput((prev) => [
            ...prev,
            { prefix: "$", content: cmd },
            { content: ret },
          ]);
        } else {
          await executeCommand(cmd);
        }

        setInputLines([""]);
        await new Promise((r) => setTimeout(r, commandDelay));
      }
    };

    runInitialCommands();
  }, [initialCommands, initialReturns, typingDelay, commandDelay, mode]);

  const executeCommand = async (cmd: string) => {
    if (cmd.trim().toLowerCase() === "clear") {
      setDisplayedOutput([]);
      setInputLines([""]);
      return;
    }

    if (mode === "websocket" && websocketRef.current) {
      websocketRef.current.send(cmd + "\n");
    } else if (mode === "sse" && sseUrl && sseCommandParam) {
      const param = encodeURIComponent(sseCommandParam);
      const encoded = encodeURIComponent(cmd);
      const contentType = sseContentType || "application/x-www-form-urlencoded";

      if (sseMethod === "POST") {
        const body =
          contentType === "application/json"
            ? JSON.stringify({ [sseCommandParam]: cmd })
            : `${param}=${encoded}`;

        const res = await fetch(sseUrl, {
          method: "POST",
          headers: { "Content-Type": contentType },
          body,
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            lines.forEach((line) => {
              if (line.trim().startsWith("data:")) {
                const data = line.replace(/^data:\s*/, "");
                setDisplayedOutput((prev) => [...prev, { content: data }]);
              }
            });
          }
        }
      } else {
        const url = `${sseUrl}?${param}=${encoded}`;
        const es = new EventSource(url);
        es.onmessage = (e) => setDisplayedOutput((prev) => [...prev, { content: e.data }]);
        es.onerror = () => {
          setDisplayedOutput((prev) => [...prev, { content: "[SSE connection closed]" }]);
          es.close();
        };
      }
    } else if (onInput) {
      const result = await onInput(cmd);
      setDisplayedOutput((prev) => [...prev, { content: result }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currentLine = inputLines[inputLines.length - 1];
      const isContinued = currentLine.trimEnd().endsWith("\\");

      if (isContinued) {
        setDisplayedOutput((prev) => [
          ...prev,
          {
            prefix: inputLines.length === 1 ? getPrompt(0) : ">",
            content: currentLine,
          },
        ]);
        setInputLines([...inputLines, ""]);
        setPrintedLineCount((c) => c + 1);
      } else {
        const unprinted = inputLines.slice(printedLineCount);
        unprinted.forEach((line, i) => {
          setDisplayedOutput((prev) => [
            ...prev,
            {
              prefix: i === 0 ? getPrompt(0) : ">",
              content: line,
            },
          ]);
        });

        const fullCommand = inputLines
          .map((line) =>
            line.trimEnd().endsWith("\\") ? line.trimEnd().slice(0, -1) : line
          )
          .join("\n");

        setInputLines([""]);
        setPrintedLineCount(0);
        executeCommand(fullCommand);
      }
    }
  };

  return (
    <div
      className={`terminal-container ${
        theme === "desktop" ? "desktop-frame" : ""
      }`}
      style={{ backgroundColor, color: textColor }}
    >
      {theme === "desktop" && (
        <div className="desktop-header">
          <span className="desktop-button red"></span>
          <span className="desktop-button yellow"></span>
          <span className="desktop-button green"></span>
        </div>
      )}
      <div className="terminal" ref={outputRef}>
        {displayedOutput.map((line, idx) => (
          <div key={idx} className="terminal-output">
            {line.prefix && <span className="terminal-prefix">{line.prefix}</span>}
            {line.content}
          </div>
        ))}
        {showInput &&
          inputLines.map((line, idx) => (
            <div key={idx} className="terminal-input-wrapper">
              <span className="terminal-prefix" style={{ color: textColor }}>
                {getPrompt(idx)}
              </span>
              <input
                ref={idx === inputLines.length - 1 ? inputRef : null}
                className="terminal-input"
                value={line}
                onChange={(e) => {
                  const updated = [...inputLines];
                  updated[idx] = e.target.value;
                  setInputLines(updated);
                }}
                onKeyDown={handleKeyDown}
                style={{ color: textColor, backgroundColor: "transparent" }}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default Terminal;
