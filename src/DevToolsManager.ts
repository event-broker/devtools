import type { EventBroker, Event } from "./external-types";
import type {
  DevToolsState,
  DevToolsConfig,
  EventDetails,
  ClientInfo,
  PerformanceMetrics,
  DeliveryStats,
} from "./types";

/**
 * DevToolsManager - Standalone DevTools controller
 *
 * Collects metrics directly from EventBroker without external observability dependencies.
 * Provides real-time monitoring and debugging capabilities.
 */
export class DevToolsManager {
  private broker?: EventBroker<any, any, any>;
  private state: DevToolsState;
  private config: DevToolsConfig;
  private listeners: Set<(state: DevToolsState) => void> = new Set();
  private updateInterval?: NodeJS.Timeout;

  // Internal metrics
  private internalMetrics = {
    events: {
      total: 0,
      byType: {} as Record<string, number>,
      latencies: [] as number[],
    },
    delivery: {
      acks: { total: 0, byType: {} as Record<string, number> },
      nacks: { total: 0, byType: {} as Record<string, number> },
    },
    startTime: Date.now(),
    eventTimers: new Map<string, number>(), // eventId -> startTime
    // Event counters per client for accurate statistics
    clientEventsSent: new Map<string, number>(), // clientId -> sent count
    clientEventsReceived: new Map<string, number>(), // clientId -> received count
    // Store broker response for each event
    brokerResponses: new Map<string, any>(), // eventId -> EventResult
  };

  constructor(config: Partial<DevToolsConfig> = {}) {
    this.config = {
      position: "bottom",
      theme: "auto",
      maxEventHistory: 1000,
      updateInterval: 1000,
      enablePersistence: true,
      ...config,
    };

    this.state = this.getInitialState();
    this.loadPersistedState();
  }

  /**
   * Attach to EventBroker instance
   *
   * @param broker - EventBroker instance to monitor
   * @returns Cleanup function to detach from broker
   */
  attachTo(broker: EventBroker<any, any, any>): () => void {
    this.broker = broker;

    // Subscribe to broker events directly
    const cleanupFunctions: (() => void)[] = [];

    // Track client subscriptions
    try {
      const brokerWithHooks = broker as any;
      if (brokerWithHooks.useOnSubscribeHandler) {
        cleanupFunctions.push(
          brokerWithHooks.useOnSubscribeHandler(
            (eventType: any, clientId: any) => {
              this.recordClientSubscription(
                String(clientId),
                String(eventType)
              );
              // DevTools should never block subscriptions
              return { allowed: true };
            }
          )
        );
      }
    } catch (error) {
      console.warn(
        "🎛️ DevTools: Failed to setup subscription tracking:",
        error
      );
    }

    // Track events in real-time
    cleanupFunctions.push(
      broker.useBeforeSendHook((event: any) => {
        this.handleEventStart(event);
        return { allowed: true };
      })
    );

    cleanupFunctions.push(
      broker.useAfterSendHook((event: any, eventResult: any) => {
        this.handleEventComplete(event, eventResult);
      })
    );

    // Start periodic metrics updates
    this.startPeriodicUpdates();

    // Initialize state
    this.updateInternalState();

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
      this.stopPeriodicUpdates();
      this.cleanup();
    };
  }

  /**
   * Handle event start
   * Records event timing and updates counters
   */
  private handleEventStart(event: Event<any, any>): void {
    // Record start time for latency calculation
    this.internalMetrics.eventTimers.set(event.id, Date.now());

    // Increment counters
    this.internalMetrics.events.total++;
    this.internalMetrics.events.byType[event.type] =
      (this.internalMetrics.events.byType[event.type] || 0) + 1;

    // Increment sent events counter for source client
    if (event.source) {
      const currentCount =
        this.internalMetrics.clientEventsSent.get(event.source) || 0;
      this.internalMetrics.clientEventsSent.set(event.source, currentCount + 1);
    }

    const eventDetails: EventDetails = {
      id: event.id,
      type: event.type,
      source: event.source,
      recipient: (event as any)["mfe-recipient"] || "*",
      timestamp: event.time || new Date().toISOString(),
      data: event.data || {},
      status: "pending",
    };

    this.addEvent(eventDetails);
  }

  /**
   * Handle event completion
   * Updates metrics, latency, and delivery status
   */
  private handleEventComplete(event: Event<any, any>, eventResult: any): void {
    // Check if event was added via handleEventStart
    // If not (e.g., blocked by ACL), add it now
    const existingEvent = this.state.events.find((e) => e.id === event.id);
    if (!existingEvent) {
      // Event was blocked before handleEventStart - add metrics
      this.internalMetrics.events.total++;
      this.internalMetrics.events.byType[event.type] =
        (this.internalMetrics.events.byType[event.type] || 0) + 1;

      // Increment sent events counter for source client
      if (event.source) {
        const currentCount =
          this.internalMetrics.clientEventsSent.get(event.source) || 0;
        this.internalMetrics.clientEventsSent.set(
          event.source,
          currentCount + 1
        );
      }

      // Add event to history
      const eventDetails: EventDetails = {
        id: event.id,
        type: event.type,
        source: event.source,
        recipient: (event as any)["mfe-recipient"] || "*",
        timestamp: event.time || new Date().toISOString(),
        data: event.data || {},
        status: "pending",
      };
      this.addEvent(eventDetails);
    }

    // Calculate latency
    const startTime = this.internalMetrics.eventTimers.get(event.id);
    if (startTime) {
      const latency = Date.now() - startTime;
      this.internalMetrics.events.latencies.push(latency);

      // Limit latencies array size
      if (this.internalMetrics.events.latencies.length > 1000) {
        this.internalMetrics.events.latencies =
          this.internalMetrics.events.latencies.slice(-500);
      }

      this.internalMetrics.eventTimers.delete(event.id);
    }

    // Increment received events counters for recipients
    const recipient = (event as any)["mfe-recipient"];
    const isSuccess = eventResult?.status === "ACK";

    if (isSuccess) {
      if (recipient === "*") {
        // Broadcast event - count for all subscribers
        this.handleBroadcastEventComplete(event, eventResult);
      } else if (recipient) {
        // Unicast event - count for specific recipient
        const currentCount =
          this.internalMetrics.clientEventsReceived.get(recipient) || 0;
        this.internalMetrics.clientEventsReceived.set(
          recipient,
          currentCount + 1
        );
      }
    }

    // Record ACK/NACK
    if (isSuccess) {
      this.internalMetrics.delivery.acks.total++;
      this.internalMetrics.delivery.acks.byType[event.type] =
        (this.internalMetrics.delivery.acks.byType[event.type] || 0) + 1;
    } else {
      this.internalMetrics.delivery.nacks.total++;
      this.internalMetrics.delivery.nacks.byType[event.type] =
        (this.internalMetrics.delivery.nacks.byType[event.type] || 0) + 1;
    }

    // Use actual EventResult from broker
    const brokerResponse = eventResult
      ? {
          status: eventResult.status,
          message: eventResult.message,
          timestamp: eventResult.timestamp,
          clientId: eventResult.clientId,
          data: eventResult.data,
        }
      : undefined;

    this.updateEvent(event.id, {
      status: isSuccess ? "delivered" : "failed",
      deliveryResult: { success: isSuccess, handled: isSuccess },
      brokerResponse,
      latency: startTime ? Date.now() - startTime : undefined,
    });
  }

  /**
   * Add event to history
   */
  private addEvent(event: EventDetails): void {
    const events = [...this.state.events, event];

    // Limit event history size
    if (events.length > this.config.maxEventHistory) {
      events.splice(0, events.length - this.config.maxEventHistory);
    }

    this.updateStatePartial({ events });
  }

  /**
   * Update existing event
   */
  private updateEvent(eventId: string, updates: Partial<EventDetails>): void {
    const events = this.state.events.map((event) =>
      event.id === eventId ? { ...event, ...updates } : event
    );

    this.updateStatePartial({ events });
  }

  /**
   * Record client subscription (for statistics)
   */
  private recordClientSubscription(clientId: string, eventType: string): void {
    // Just log for debugging, actual data comes from broker.getSubscriptions()
  }

  /**
   * Start periodic metrics updates
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateInternalState();
    }, this.config.updateInterval);
  }

  private stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Update state from internal metrics
   */
  private updateInternalState(): void {
    try {
      const clients = this.buildClientsInfo();
      const metrics = this.buildPerformanceMetrics();
      const deliveryStats = this.buildDeliveryStats();

      this.updateStatePartial({
        clients,
        metrics,
        deliveryStats,
        isConnected: true,
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("🎛️ DevTools: Failed to update internal state:", error);
      this.updateStatePartial({ isConnected: false });
    }
  }

  /**
   * Build clients info from broker
   */
  private buildClientsInfo(): ClientInfo[] {
    if (!this.broker) return [];

    try {
      // Use type assertion to bypass typing issues
      const brokerWithAll = this.broker as any;

      // Get all client instances
      const allClients = brokerWithAll.getAllClients
        ? brokerWithAll.getAllClients()
        : [];

      // Get subscriptions for each client
      const subscriptions = brokerWithAll.getSubscriptions
        ? brokerWithAll.getSubscriptions()
        : {};

      if (!allClients || !Array.isArray(allClients)) {
        console.warn("🎛️ DevTools: No client data available");
        return [];
      }

      return allClients.map((clientInstance: any) => {
        const clientId = clientInstance.id;
        const clientType =
          this.getClientTypeFromInstance(clientInstance) ||
          this.guessClientType(clientId);

        return {
          id: clientId,
          type: clientType,
          subscriptions: (subscriptions[clientId] as string[]) || [],
          eventsReceived: this.countEventsReceivedByClient(clientId),
          eventsSent: this.countEventsSentByClient(clientId),
          status: "active" as const,
          lastActivity: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.warn(
        "🎛️ DevTools: Failed to get clients info from broker:",
        error
      );
      return [];
    }
  }

  /**
   * Determine client type from instance
   */
  private getClientTypeFromInstance(
    clientInstance: any
  ): ClientInfo["type"] | null {
    if (!clientInstance) return null;

    // Use static clientType field from client class
    const constructor = clientInstance.constructor;
    if (constructor && constructor.clientType) {
      return constructor.clientType as ClientInfo["type"];
    }

    return null;
  }

  /**
   * Determine client type by ID (fallback)
   */
  private guessClientType(clientId: string): ClientInfo["type"] {
    if (clientId.includes("websocket") || clientId.includes("ws"))
      return "WebSocketClient";
    if (clientId.includes("postmessage") || clientId.includes("iframe"))
      return "PostMessageClient";
    if (clientId.includes("worker")) return "WorkerClient";
    return "InMemoryClient";
  }

  /**
   * Handle broadcast event - count for all subscribers
   */
  private handleBroadcastEventComplete(
    event: Event<any, any>,
    eventResult: any
  ): void {
    if (!this.broker || eventResult.status !== "ACK") return;

    try {
      // Get all client subscriptions (clientId -> eventTypes[])
      const subscriptions = (this.broker as any).getSubscriptions();

      if (subscriptions) {
        // Loop through all clients and check if they're subscribed to this event type
        for (const [clientId, eventTypes] of Object.entries(subscriptions)) {
          // Skip sender
          if (clientId === event.source) continue;

          // Check if client is subscribed to this event type
          if ((eventTypes as string[]).includes(event.type)) {
            const currentCount =
              this.internalMetrics.clientEventsReceived.get(clientId) || 0;
            this.internalMetrics.clientEventsReceived.set(
              clientId,
              currentCount + 1
            );
          }
        }
      }
    } catch (error) {
      console.warn("🎛️ DevTools: Failed to count broadcast recipients:", error);
    }
  }

  /**
   * Count sent events for client
   */
  private countEventsSentByClient(clientId: string): number {
    return this.internalMetrics.clientEventsSent.get(clientId) || 0;
  }

  /**
   * Count received events for client
   */
  private countEventsReceivedByClient(clientId: string): number {
    return this.internalMetrics.clientEventsReceived.get(clientId) || 0;
  }

  /**
   * Build performance metrics from internal data
   */
  private buildPerformanceMetrics(): PerformanceMetrics {
    const latencies = this.internalMetrics.events.latencies;
    const uptimeSeconds = (Date.now() - this.internalMetrics.startTime) / 1000;

    return {
      totalEvents: this.internalMetrics.events.total,
      eventsPerSecond:
        uptimeSeconds > 0
          ? this.internalMetrics.events.total / uptimeSeconds
          : 0,
      averageLatency:
        latencies.length > 0
          ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
          : 0,
      minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
      maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
      memoryUsage: this.getMemoryUsage(),
      uptime: Math.floor(uptimeSeconds),
      successRate: this.calculateSuccessRate(),
    };
  }

  /**
   * Build delivery statistics from internal data
   */
  private buildDeliveryStats(): DeliveryStats {
    const totalDelivery =
      this.internalMetrics.delivery.acks.total +
      this.internalMetrics.delivery.nacks.total;

    const successRate = this.calculateSuccessRate();

    return {
      acks: this.internalMetrics.delivery.acks,
      nacks: this.internalMetrics.delivery.nacks,
      totalDelivery,
      successRate,
    };
  }

  /**
   * Calculate delivery success rate
   */
  private calculateSuccessRate(): number {
    const total =
      this.internalMetrics.delivery.acks.total +
      this.internalMetrics.delivery.nacks.total;
    return total > 0 ? this.internalMetrics.delivery.acks.total / total : 0;
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): string {
    if (typeof window !== "undefined" && (performance as any).memory) {
      return (
        ((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1) +
        " MB"
      );
    }
    return "N/A";
  }

  /**
   * Partial state update
   */
  private updateStatePartial(updates: Partial<DevToolsState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
    this.persistState();
  }

  /**
   * Notify listeners about state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: DevToolsState) => void): () => void {
    this.listeners.add(listener);

    // Call immediately with current state
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current state
   */
  getState(): DevToolsState {
    return { ...this.state };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<DevToolsState["settings"]>): void {
    this.updateStatePartial({
      settings: { ...this.state.settings, ...updates },
    });
  }

  /**
   * Clear event history
   */
  clearEvents(): void {
    this.updateStatePartial({ events: [] });
  }

  /**
   * Save state to localStorage
   */
  private persistState(): void {
    if (!this.config.enablePersistence) return;

    try {
      const persistData = {
        settings: this.state.settings,
      };
      localStorage.setItem(
        "__EVENT_BROKER_DEVTOOLS_STATE__",
        JSON.stringify(persistData)
      );
    } catch (error) {
      console.warn("🎛️ DevTools: Failed to persist state:", error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadPersistedState(): void {
    if (!this.config.enablePersistence) return;

    try {
      const saved = localStorage.getItem("__EVENT_BROKER_DEVTOOLS_STATE__");
      if (saved) {
        const persistData = JSON.parse(saved);
        this.state.settings = {
          ...this.state.settings,
          ...persistData.settings,
        };
      }
    } catch (error) {
      console.warn("🎛️ DevTools: Failed to load persisted state:", error);
    }
  }

  /**
   * Get initial state
   */
  private getInitialState(): DevToolsState {
    return {
      settings: {
        isOpen: false,
        position: this.config.position,
        activeTab: "overview",
        eventFilters: {
          types: [],
          sources: [],
          recipients: [],
          status: [],
        },
        maxEvents: 1000,
        autoScroll: true,
        showTimestamps: true,
      },
      events: [],
      clients: [],
      metrics: {
        totalEvents: 0,
        eventsPerSecond: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        memoryUsage: "N/A",
        uptime: 0,
        successRate: 0,
      },
      deliveryStats: {
        acks: { total: 0, byType: {} },
        nacks: { total: 0, byType: {} },
        totalDelivery: 0,
        successRate: 0,
      },
      isConnected: false,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Send test message
   */
  public sendTestMessage(
    eventType: string,
    data: any,
    options?: { recipient?: string; source?: string }
  ): void {
    if (!this.broker) {
      console.warn(
        "🎛️ DevTools: Broker not available for sending test message"
      );
      return;
    }

    try {
      const sender = options?.source || "devtools";

      if (options?.recipient && options.recipient !== "*") {
        // Unicast message
        (this.broker as any).sendTo(
          eventType,
          sender, // sender
          options.recipient, // recipient
          data // payload
        );
      } else {
        // Broadcast message
        (this.broker as any).broadcast(
          eventType,
          sender, // sender
          data // payload
        );
      }
    } catch (error) {
      console.error("🎛️ DevTools: Failed to send test message", error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.listeners.clear();
  }
}
