import React, { useState, useEffect, useRef } from "react";
import type { FC } from "react";
import type { DevToolsState, EventMetadata } from "../../types";
import "./DebugTab.css";

interface DebugTabProps {
  state: DevToolsState;
  onClearEvents: () => void;
  onSendTestMessage?: (
    eventType: string,
    data: any,
    options?: { recipient?: string; source?: string }
  ) => void;
  availableEvents?: EventMetadata[];
}

/**
 * 🐛 Debug Tab - инструменты для отладки
 */
export const DebugTab: FC<DebugTabProps> = ({
  state,
  onClearEvents,
  onSendTestMessage,
  availableEvents,
}) => {
  // 📤 Состояние для отправки сообщений
  const [messageForm, setMessageForm] = useState({
    eventType: "",
    recipient: "*", // broadcast by default
    source: "devtools", // default source
    data: "{}",
  });

  // 📋 Доступные события из registry или fallback
  const events = availableEvents || [
    {
      type: "test.message.v1",
      description: "🧪 Тестовое сообщение",
      examplePayload: { message: "Test message", timestamp: Date.now() },
    },
  ];

  // 🔍 Состояние для поиска событий
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Фильтрация событий по поиску
  const filteredEvents = events.filter(
    (event) =>
      event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📝 Выбор события из списка
  const handleEventSelect = (event: EventMetadata) => {
    setMessageForm((prev) => ({
      ...prev,
      eventType: event.type,
      data: JSON.stringify(event.examplePayload, null, 2),
    }));
    setSearchTerm(event.type);
    setIsDropdownOpen(false);
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      events: state.events,
      clients: state.clients,
      metrics: state.metrics,
      deliveryStats: state.deliveryStats,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventbroker-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const data = {
      events: state.events.slice(-10), // последние 10 событий
      clients: state.clients,
      metrics: state.metrics,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  // 📤 Отправка тестового сообщения
  const handleSendMessage = () => {
    if (!onSendTestMessage) {
      return;
    }

    try {
      const parsedData = JSON.parse(messageForm.data);
      const recipient =
        messageForm.recipient === "*" ? undefined : messageForm.recipient;

      onSendTestMessage(messageForm.eventType, parsedData, {
        recipient,
        source: messageForm.source,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="debug-tab">
      {/* 📤 Форма отправки сообщений */}
      {onSendTestMessage ? (
        <div className="debug-tab__section">
          <h3>📤 Send Test Message</h3>

          <div className="debug-tab__message-form">
            {/* Event Type с поиском */}
            <div className="debug-tab__form-field">
              <label className="debug-tab__label">Event Type:</label>
              <div className="debug-tab__select-container" ref={dropdownRef}>
                <input
                  type="text"
                  className="debug-tab__search-input"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    setMessageForm((prev) => ({
                      ...prev,
                      eventType: e.target.value,
                    }));
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Type to search events..."
                />
                {isDropdownOpen && filteredEvents.length > 0 && (
                  <div className="debug-tab__dropdown">
                    {filteredEvents.map((event, index) => (
                      <div
                        key={index}
                        className="debug-tab__dropdown-item"
                        onClick={() => handleEventSelect(event)}
                      >
                        <div className="debug-tab__dropdown-type">
                          {event.type}
                        </div>
                        <div className="debug-tab__dropdown-desc">
                          {event.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Source */}
            <div className="debug-tab__form-field">
              <label className="debug-tab__label">Source:</label>
              <select
                className="debug-tab__select"
                value={messageForm.source}
                onChange={(e) =>
                  setMessageForm((prev) => ({
                    ...prev,
                    source: e.target.value,
                  }))
                }
              >
                <option value="devtools">devtools</option>
                {state.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.id} ({client.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient */}
            <div className="debug-tab__form-field">
              <label className="debug-tab__label">Recipient:</label>
              <select
                className="debug-tab__select"
                value={messageForm.recipient}
                onChange={(e) =>
                  setMessageForm((prev) => ({
                    ...prev,
                    recipient: e.target.value,
                  }))
                }
              >
                <option value="*">* (Broadcast to all)</option>
                {state.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.id} ({client.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div className="debug-tab__form-field">
              <label className="debug-tab__label">Data (JSON):</label>
              <textarea
                className="debug-tab__textarea"
                value={messageForm.data}
                onChange={(e) =>
                  setMessageForm((prev) => ({
                    ...prev,
                    data: e.target.value,
                  }))
                }
                placeholder='{"userId": "user123"}'
                rows={6}
              />
            </div>

            {/* Actions */}
            <div className="debug-tab__form-actions">
              <button
                className="debug-tab__btn debug-tab__btn--primary"
                onClick={handleSendMessage}
                disabled={!messageForm.eventType.trim()}
              >
                🚀 Send Message
              </button>
              <button
                className="debug-tab__btn"
                onClick={() => {
                  setMessageForm({
                    eventType: "",
                    recipient: "*",
                    source: "devtools",
                    data: "{}",
                  });
                  setSearchTerm("");
                }}
              >
                🔄 Reset Form
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="debug-tab__section">
          <h3>📤 Message Sending Unavailable</h3>
          <p>Message sending functionality is not available.</p>
        </div>
      )}
    </div>
  );
};
