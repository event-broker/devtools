/**
 * EventBroker DevTools Type Definitions
 */

// Event type definitions
export interface EventDetails {
  id: string;
  type: string;
  source: string;
  recipient: string;
  timestamp: string;
  data: Record<string, any>;
  latency?: number;
  status: "pending" | "delivered" | "failed";
  deliveryResult?: {
    success: boolean;
    handled: boolean;
  };
  brokerResponse?: {
    // Full EventResult from broker
    status: "ACK" | "NACK";
    message: string;
    timestamp: number;
    clientId?: string;
    data?: any;
  };
}

// Client information
export interface ClientInfo {
  id: string;
  type:
    | "InMemoryClient"
    | "PostMessageClient"
    | "ServiceWorkerClient"
    | "WebSocketClient"
    | "WorkerClient";
  subscriptions: string[];
  eventsReceived: number;
  eventsSent: number;
  lastActivity?: string;
  status: "active" | "inactive" | "error";
}

// Performance metrics
export interface PerformanceMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  memoryUsage: string;
  uptime: number;
  successRate: number;
}

// Delivery statistics
export interface DeliveryStats {
  acks: {
    total: number;
    byType: Record<string, number>;
  };
  nacks: {
    total: number;
    byType: Record<string, number>;
  };
  totalDelivery: number;
  successRate: number;
}

// Event metadata for DevTools
export interface EventMetadata {
  type: string;
  description: string;
  examplePayload: any;
}

// DevTools settings
export interface DevToolsSettings {
  isOpen: boolean;
  position: DevToolsPosition;
  activeTab: "overview" | "events" | "clients" | "debug";
  eventFilters: {
    types: string[];
    sources: string[];
    recipients: string[];
    status: ("pending" | "delivered" | "failed")[];
  };
  maxEvents: number;
  autoScroll: boolean;
  showTimestamps: boolean;
}

// DevTools state
export interface DevToolsState {
  settings: DevToolsSettings;
  events: EventDetails[];
  clients: ClientInfo[];
  metrics: PerformanceMetrics;
  deliveryStats: DeliveryStats;
  isConnected: boolean;
  lastUpdate: string;
}

// DevTools positioning modes
export type DevToolsPosition =
  | "bottom" // Docked to bottom (full width, default)
  | "right" // Docked to right side
  | "left" // Docked to left side
  | "floating"; // Floating window

// DevTools configuration
export interface DevToolsConfig {
  position: DevToolsPosition;
  theme: "light" | "dark" | "auto";
  maxEventHistory: number;
  updateInterval: number;
  enablePersistence: boolean;
  availableEvents?: EventMetadata[];
}
