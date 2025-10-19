<div align="center">
  <img src=".github/assets/mascote.png" alt="Event Broker DevTools Mascot" width="200" />
  
  # @event-broker/devtools

> Professional debugging panel for Event Broker - monitor and debug microfrontend communication in real-time

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

**Event Broker DevTools** provides a React Query DevTools-style interface for monitoring, debugging, and testing event-driven communication in microfrontend architectures. Get complete visibility into your event flows with minimal setup.

## ✨ Key Features

- 📊 **Real-time Monitoring** - Live event stream with delivery status tracking
- 🔍 **Advanced Filtering** - Filter by type, source, recipient, and status
- 👥 **Client Management** - Monitor all connected clients and their subscriptions
- 🐛 **Debug Tools** - Send test events with payload templates
- 📈 **Performance Metrics** - Track throughput, latency, and success rates
- 🎯 **Drag & Resize** - Professional movable interface that stays out of your way
- 🌙 **Theme Support** - Auto-detect system theme (light/dark)
- 🔌 **Zero Impact** - Tree-shakeable, disabled in production by default

## 🚀 Quick Start

### Installation

```bash
npm install @event-broker/devtools
```

### Basic Usage

```tsx
import React from "react";
import { EventBroker } from "@event-broker/core";
import { EventBrokerDevTools } from "@event-broker/devtools";

const broker = new EventBroker();

function App() {
  return (
    <div>
      {/* Your application */}

      {/* DevTools - only in development */}
      {process.env.NODE_ENV === "development" && (
        <EventBrokerDevTools broker={broker} />
      )}
    </div>
  );
}
```

## 📖 API Reference

### `<EventBrokerDevTools>`

Main component providing the debugging interface.

#### Props

| Prop      | Type             | Default | Description                     |
| --------- | ---------------- | ------- | ------------------------------- |
| `broker`  | `EventBroker`    | **required** | EventBroker instance to monitor |
| `enabled` | `boolean`        | `true`  | Enable/disable DevTools         |
| `config`  | `DevToolsConfig` | `{}`    | Configuration options           |

#### Configuration Options

All configuration options are optional and have sensible defaults:

```typescript
{
  position?: "bottom" | "right" | "left" | "floating";  // Default: "bottom"
  theme?: "light" | "dark" | "auto";                    // Default: "auto"
  maxEventHistory?: number;                             // Default: 1000
  updateInterval?: number;                              // Default: 1000ms
  enablePersistence?: boolean;                          // Default: true
  availableEvents?: EventMetadata[];                    // For autocomplete
}
```

## 🎯 Features Overview

### 📊 Overview Tab

Real-time system dashboard:

- **System Health** - Connection status indicator
- **Active Clients** - Number of registered clients
- **Success Rate** - Event delivery success percentage
- **Memory Usage** - JavaScript heap monitoring
- **Delivery Stats** - ACK/NACK counters by event type

### 🔄 Events Tab

Complete event inspection:

- **Live Stream** - Real-time event monitoring with auto-scroll
- **Advanced Filters** - Multi-dimensional filtering:
  - Event type
  - Source client
  - Recipient client
  - Delivery status (pending/delivered/failed)
- **Full-text Search** - Search across all event data
- **Event Inspector** - Expandable detailed view with JSON payload
- **Timestamps** - Precise timing information with latency

### 👥 Clients Tab

Client monitoring and management:

- **Client Registry** - All connected clients with metadata
- **Subscription Tracking** - Events each client listens to
- **Activity Metrics** - Sent/received event counters
- **Status Indicators** - Active/inactive/error states
- **Quick Navigation** - Click to filter events by client

### 🐛 Debug Tab

Interactive testing tools:

- **Event Sender** - Send test events to any client
- **Event Autocomplete** - Dropdown with all available event types
- **Payload Templates** - Pre-filled example payloads from metadata
- **Broadcast/Unicast** - Send to specific clients or broadcast to all
- **JSON Editor** - Edit payloads with validation

## 🎨 Advanced Usage

### Custom Event Registry

Provide event metadata for better autocomplete and testing:

```tsx
import { EventBrokerDevTools } from "@event-broker/devtools";

const eventMetadata = [
  {
    type: "user.loggedIn.v1",
    description: "👤 User successfully logged in",
    examplePayload: { 
      userId: "user_123", 
      email: "user@example.com",
      timestamp: Date.now() 
    },
  },
  {
    type: "order.created.v1",
    description: "🛒 New order created",
    examplePayload: { 
      orderId: "order_456", 
      items: [],
      total: 99.99 
    },
  },
];

<EventBrokerDevTools
  broker={broker}
  config={{ 
    availableEvents: eventMetadata,
    maxEventHistory: 500 
  }}
/>
```

### Conditional Rendering

Control when DevTools are available:

```tsx
// Only in development
<EventBrokerDevTools
  broker={broker}
  enabled={process.env.NODE_ENV === "development"}
/>

// With query parameter
<EventBrokerDevTools
  broker={broker}
  enabled={window.location.search.includes("debug=true")}
/>

// With feature flag
<EventBrokerDevTools
  broker={broker}
  enabled={featureFlags.enableDevTools}
/>
```



## 🛠️ Development

### Project Structure

```
src/
├── components/
│   ├── EventBrokerDevTools.tsx      # Main component
│   ├── DevToolsPanel.tsx            # Panel content with tabs
│   ├── DraggableResizablePanel.tsx  # Drag & resize wrapper
│   ├── FloatingButton.tsx           # Toggle button
│   └── tabs/                        # Tab components
├── DevToolsManager.ts               # Core logic & state management
├── types/
│   └── index.ts                     # TypeScript type definitions
└── index.ts                         # Public API
```

### Building

```bash
# Build TypeScript + copy assets
npm run build

# Watch mode
npm run watch

# Lint
npm run lint

# Format
npm run format
```

### Testing

```bash
npm test
npm run test:watch
```

## 🎭 UI Components

### Draggable & Resizable Panel

The DevTools panel provides a professional, non-intrusive debugging experience:

- **Drag** - Click and drag the header to reposition
- **Resize** - Drag corners and edges to resize
- **Minimize** - Collapse to a floating button
- **Boundary Detection** - Smart positioning that respects viewport edges

### Professional Design

- **Modern Interface** - Clean, minimal design inspired by React Query DevTools
- **Status Colors** - Visual indicators (green=success, red=error, yellow=pending)
- **Hover Effects** - Interactive feedback on all controls
- **Responsive** - Adapts to different screen sizes

## 📊 Performance

DevTools are optimized for minimal performance impact:

- **Efficient Updates** - Batched updates every 100ms (configurable)
- **Memory Management** - Automatic event history pruning
- **Lazy Rendering** - Only active tab is rendered
- **Production Safety** - Tree-shakeable when disabled

## 🔗 Ecosystem

Part of the Event Broker ecosystem:

- **[@event-broker/core](../event-broker)** - Core event broker library
- **[@event-broker/event-registry](../event-registry)** - Event type registry

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT © 2024 Event Broker Contributors

## 🙏 Acknowledgments

Inspired by:

- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools) - UI/UX design patterns
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - State inspection approach
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools) - Professional debugging experience

---

**Need help?** Check out our [documentation](https://github.com/event-broker) or open an [issue](https://github.com/event-broker/devtools/issues).
