# Compies Component Library

This library provides some useful reusable React components.

## Features

- Pre-built, customizable React components.
- Compatible with modern React frameworks like Vite (requires ECMAScript 6 support).

## Installation

Install the library using npm or yarn:

```bash
npm install compies
# or
yarn add compies
```

## Usage

Import and use the components in your project:

```jsx
import { LlmChat, Terminal } from 'compies';

import "compies/style";

function App() {
    return (
        <div>
            <div class="llm-chat">
                <LlmChat 
                    withHistory={true} 
                    llm={
                        name: "openai", 
                        model: "gpt-4o", 
                        baseUri: "https://api.openai.com/v1", 
                        apiKey: "your-api-key" 
                    }
                </LlmChat>
            </div>
            <div class="terminal">
                <Terminal websocketUrl="ws://localhost:12345/ws" />
            </div>
        </div>
    );
}
```

## Examples

### Llm chat

![Alt text](https://raw.githubusercontent.com/sebps/compies/main/assets/llm.png)

### Terminal

![Alt text](https://raw.githubusercontent.com/sebps/compies/main/assets/terminal.png)

## Storybook

For detailed usage and customization options, visit the [storybook](https://compies.netlify.app).