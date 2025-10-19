import React, { useState, useMemo, useRef, useEffect } from "react";
import type { FC } from "react";
import type { EventDetails, DevToolsState } from "../../types";
import "./EventsTab.css";

interface EventsTabProps {
  events: EventDetails[];
  settings: DevToolsState["settings"];
  clients: DevToolsState["clients"];
  onSettingsUpdate: (updates: Partial<DevToolsState["settings"]>) => void;
  onClearEvents: () => void;
}

/**
 * 🔄 Events Tab - real-time поток событий (главная фишка для демо!)
 */
export const EventsTab: FC<EventsTabProps> = ({
  events,
  settings,
  clients,
  onSettingsUpdate,
  onClearEvents,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const eventsListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll при новых событиях
  useEffect(() => {
    if (settings.autoScroll && eventsListRef.current) {
      eventsListRef.current.scrollTop = eventsListRef.current.scrollHeight;
    }
  }, [events.length, settings.autoScroll]);

  // Фильтрация событий
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Поиск по тексту
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          event.type.toLowerCase().includes(searchLower) ||
          event.source.toLowerCase().includes(searchLower) ||
          event.recipient.toLowerCase().includes(searchLower) ||
          JSON.stringify(event.data).toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Фильтр по типам событий
      if (settings.eventFilters.types.length > 0) {
        if (!settings.eventFilters.types.includes(event.type)) return false;
      }

      // Фильтр по источникам
      if (settings.eventFilters.sources.length > 0) {
        if (!settings.eventFilters.sources.includes(event.source)) return false;
      }

      // Фильтр по получателям
      // Включаем как события, адресованные конкретному клиенту, так и broadcast события (*)
      if (settings.eventFilters.recipients.length > 0) {
        const isBroadcast = event.recipient === "*";

        if (isBroadcast) {
          // Broadcast событие - проверяем, подписан ли хотя бы один из фильтруемых клиентов на это событие
          const isSubscribed = settings.eventFilters.recipients.some(
            (clientId) => {
              const client = clients.find((c) => c.id === clientId);
              return client?.subscriptions.includes(event.type);
            }
          );
          if (!isSubscribed) return false;
        } else {
          // Unicast событие - проверяем, что получатель в списке фильтра
          if (!settings.eventFilters.recipients.includes(event.recipient)) {
            return false;
          }
        }
      }

      // Фильтр по статусу
      if (settings.eventFilters.status.length > 0) {
        if (!settings.eventFilters.status.includes(event.status)) return false;
      }

      return true;
    });
  }, [events, searchTerm, settings.eventFilters, clients]);

  // Уникальные значения для фильтров
  const uniqueTypes = [...new Set(events.map((e) => e.type))];
  const uniqueSources = [...new Set(events.map((e) => e.source))];
  const uniqueRecipients = [...new Set(events.map((e) => e.recipient))];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return settings.showTimestamps
      ? date.toLocaleTimeString() +
          "." +
          date.getMilliseconds().toString().padStart(3, "0")
      : date.toLocaleTimeString();
  };

  const getStatusIcon = (status: EventDetails["status"]) => {
    switch (status) {
      case "delivered":
        return "✅";
      case "failed":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: EventDetails["status"]) => {
    switch (status) {
      case "delivered":
        return "#22c55e";
      case "failed":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      default:
        return "#666666";
    }
  };

  return (
    <div className="events-tab">
      {/* Toolbar */}
      <div className="events-tab__toolbar">
        <div className="events-tab__toolbar-left">
          {/* Поиск */}
          <div className="events-tab__search">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="events-tab__search-input"
            />
            {searchTerm && (
              <button
                className="events-tab__search-clear"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Быстрые фильтры */}
          <div className="events-tab__quick-filters">
            <button
              className={`events-tab__filter-btn ${
                settings.eventFilters.status.includes("failed")
                  ? "events-tab__filter-btn--active"
                  : ""
              }`}
              onClick={() => {
                const newStatus = settings.eventFilters.status.includes(
                  "failed"
                )
                  ? settings.eventFilters.status.filter((s) => s !== "failed")
                  : [...settings.eventFilters.status, "failed" as const];
                onSettingsUpdate({
                  eventFilters: { ...settings.eventFilters, status: newStatus },
                });
              }}
            >
              ❌ Failed
            </button>
            <button
              className={`events-tab__filter-btn ${
                settings.eventFilters.status.includes("delivered")
                  ? "events-tab__filter-btn--active"
                  : ""
              }`}
              onClick={() => {
                const newStatus = settings.eventFilters.status.includes(
                  "delivered"
                )
                  ? settings.eventFilters.status.filter(
                      (s) => s !== "delivered"
                    )
                  : [...settings.eventFilters.status, "delivered" as const];
                onSettingsUpdate({
                  eventFilters: { ...settings.eventFilters, status: newStatus },
                });
              }}
            >
              ✅ Success
            </button>
          </div>
        </div>

        <div className="events-tab__toolbar-right">
          {/* Настройки */}
          <label className="events-tab__setting">
            <input
              type="checkbox"
              checked={settings.autoScroll}
              onChange={(e) =>
                onSettingsUpdate({ autoScroll: e.target.checked })
              }
            />
            Auto-scroll
          </label>
          <label className="events-tab__setting">
            <input
              type="checkbox"
              checked={settings.showTimestamps}
              onChange={(e) =>
                onSettingsUpdate({ showTimestamps: e.target.checked })
              }
            />
            Timestamps
          </label>

          {/* Очистка фильтров */}
          {(settings.eventFilters.sources.length > 0 ||
            settings.eventFilters.recipients.length > 0 ||
            settings.eventFilters.types.length > 0 ||
            settings.eventFilters.status.length > 0) && (
            <button
              className="events-tab__clear-filters-btn"
              onClick={() =>
                onSettingsUpdate({
                  eventFilters: {
                    sources: [],
                    recipients: [],
                    types: [],
                    status: [],
                  },
                })
              }
              title="Clear all filters"
            >
              🔄 Clear Filters
            </button>
          )}

          {/* Очистка */}
          <button
            className="events-tab__clear-btn"
            onClick={onClearEvents}
            title="Clear all events"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="events-tab__stats">
        <span>
          Showing {filteredEvents.length} of {events.length} events
        </span>
        {searchTerm && <span>• Filtered by: "{searchTerm}"</span>}
        {settings.eventFilters.sources.length > 0 && (
          <span>• Sources: {settings.eventFilters.sources.join(", ")}</span>
        )}
        {settings.eventFilters.recipients.length > 0 && (
          <span>
            • Recipients: {settings.eventFilters.recipients.join(", ")}
          </span>
        )}
        {settings.eventFilters.types.length > 0 && (
          <span>• Types: {settings.eventFilters.types.join(", ")}</span>
        )}
        {settings.eventFilters.status.length > 0 && (
          <span>• Status: {settings.eventFilters.status.join(", ")}</span>
        )}
      </div>

      <div className="events-tab__content">
        {/* Список событий */}
        <div className="events-tab__events" ref={eventsListRef}>
          {filteredEvents.length === 0 ? (
            <div className="events-tab__empty">
              {events.length === 0
                ? "No events yet"
                : "No events match your filters"}
            </div>
          ) : (
            (() => {
              return filteredEvents.map((event) => {
                return (
                  <div
                    key={event.id}
                    className={`
                  events-tab__event
                  ${
                    selectedEvent?.id === event.id
                      ? "events-tab__event--selected"
                      : ""
                  }
                `}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="events-tab__event-header">
                      <div className="events-tab__event-left">
                        <span
                          className="events-tab__event-status"
                          style={{ color: getStatusColor(event.status) }}
                        >
                          {getStatusIcon(event.status)}
                        </span>
                        <span className="events-tab__event-type">
                          {event.type}
                        </span>
                      </div>
                      <div className="events-tab__event-right">
                        {settings.showTimestamps && (
                          <span className="events-tab__event-time">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        )}
                        {event.latency && (
                          <span className="events-tab__event-latency">
                            {event.latency}ms
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="events-tab__event-route">
                      <span className="events-tab__event-source">
                        {event.source || "N/A"}
                      </span>
                      <span className="events-tab__event-arrow">→</span>
                      <span className="events-tab__event-recipient">
                        {event.recipient || "N/A"}
                      </span>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>

        {/* Детали события */}
        {selectedEvent && (
          <div className="events-tab__details">
            <div className="events-tab__details-header">
              <h4>Event Details</h4>
              <button
                className="events-tab__details-close"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </button>
            </div>
            <div className="events-tab__details-content">
              <div className="events-tab__detail-section">
                <h5>Basic Info</h5>
                <div className="events-tab__detail-grid">
                  <div className="events-tab__detail-item">
                    <span className="events-tab__detail-label">ID:</span>
                    <span className="events-tab__detail-value">
                      {selectedEvent.id}
                    </span>
                  </div>
                  <div className="events-tab__detail-item">
                    <span className="events-tab__detail-label">Type:</span>
                    <span className="events-tab__detail-value">
                      {selectedEvent.type}
                    </span>
                  </div>
                  <div className="events-tab__detail-item">
                    <span className="events-tab__detail-label">Status:</span>
                    <span
                      className="events-tab__detail-value"
                      style={{ color: getStatusColor(selectedEvent.status) }}
                    >
                      {getStatusIcon(selectedEvent.status)}{" "}
                      {selectedEvent.status}
                    </span>
                  </div>
                  <div className="events-tab__detail-item">
                    <span className="events-tab__detail-label">Source:</span>
                    <span className="events-tab__detail-value">
                      {selectedEvent.source || "N/A"}
                    </span>
                  </div>
                  <div className="events-tab__detail-item">
                    <span className="events-tab__detail-label">Recipient:</span>
                    <span className="events-tab__detail-value">
                      {selectedEvent.recipient || "N/A"}
                    </span>
                  </div>
                  <div className="events-tab__detail-item">
                    <span className="events-tab__detail-label">Timestamp:</span>
                    <span className="events-tab__detail-value">
                      {formatTimestamp(selectedEvent.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="events-tab__detail-section">
                <h5>Event Payload</h5>
                <pre className="events-tab__detail-json">
                  {JSON.stringify(selectedEvent.data || {}, null, 2)}
                </pre>
              </div>

              {selectedEvent.brokerResponse && (
                <div className="events-tab__detail-section">
                  <h5>RESPONSE RESULT</h5>
                  <div className="events-tab__detail-grid">
                    <div className="events-tab__detail-item">
                      <span className="events-tab__detail-label">Status:</span>
                      <span
                        className="events-tab__detail-value"
                        style={{
                          color:
                            selectedEvent.brokerResponse.status === "ACK"
                              ? "#22c55e"
                              : "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        {selectedEvent.brokerResponse.status}
                      </span>
                    </div>
                    <div className="events-tab__detail-item">
                      <span className="events-tab__detail-label">Message:</span>
                      <span className="events-tab__detail-value">
                        {selectedEvent.brokerResponse.message}
                      </span>
                    </div>
                  </div>
                  {selectedEvent.brokerResponse.data !== undefined && (
                    <>
                      <h6
                        style={{
                          marginTop: "12px",
                          marginBottom: "8px",
                          fontSize: "13px",
                          color: "#666",
                        }}
                      >
                        RESPONSE DATA:
                      </h6>
                      <pre className="events-tab__detail-json">
                        {JSON.stringify(
                          selectedEvent.brokerResponse.data,
                          null,
                          2
                        )}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
