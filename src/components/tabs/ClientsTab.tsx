import React, { useState, useEffect } from "react";
import type { FC } from "react";
import type { ClientInfo } from "../../types";
import "./ClientsTab.css";

interface ClientsTabProps {
  clients: ClientInfo[];
  onNavigateToEvents?: (
    filterType: "recipient" | "source",
    clientId: string
  ) => void;
}

/**
 * 👥 Clients Tab - расширенная информация о клиентах
 */
export const ClientsTab: FC<ClientsTabProps> = ({
  clients,
  onNavigateToEvents,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);

  // 🔄 Обновляем selectedClient когда clients обновляются
  useEffect(() => {
    if (selectedClient && clients.length > 0) {
      const updatedClient = clients.find((c) => c.id === selectedClient.id);
      if (updatedClient) {
        setSelectedClient(updatedClient);
      }
    }
  }, [clients, selectedClient]);

  // Фильтрация клиентов
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || client.type === filterType;
    return matchesSearch && matchesType;
  });

  // Получаем уникальные типы клиентов
  const clientTypes = Array.from(new Set(clients.map((c) => c.type)));

  return (
    <div className="clients-tab">
      {/* Toolbar */}
      <div className="clients-tab__toolbar">
        <div className="clients-tab__toolbar-left">
          <h3>
            👥 Clients ({filteredClients.length} of {clients.length})
          </h3>
        </div>
        <div className="clients-tab__toolbar-right">
          {/* Поиск */}
          <div className="clients-tab__search">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="clients-tab__search-input"
            />
          </div>
          {/* Фильтр */}
          <div className="clients-tab__filter">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="clients-tab__filter-select"
            >
              <option value="all">All Types</option>
              {clientTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Основной контент - список + боковая панель */}
      <div className="clients-tab__content">
        {/* Список клиентов */}
        <div className="clients-tab__list">
          {filteredClients.length === 0 ? (
            <div className="clients-tab__empty">
              {clients.length === 0
                ? "No clients registered"
                : "No clients match the current filters"}
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className={`clients-tab__client ${
                  selectedClient?.id === client.id
                    ? "clients-tab__client--selected"
                    : ""
                }`}
                onClick={() => setSelectedClient(client)}
              >
                <div className="clients-tab__client-main">
                  <div className="clients-tab__client-header">
                    <span className="clients-tab__client-id">{client.id}</span>
                    <span className="clients-tab__client-type-badge">
                      {client.type}
                    </span>
                  </div>
                  <div className="clients-tab__client-status">
                    <span
                      className={`clients-tab__status-indicator clients-tab__status-indicator--${client.status}`}
                    >
                      {client.status === "active" ? "🟢" : "🔴"}
                    </span>
                    <span className="clients-tab__status-text">
                      {client.status}
                    </span>
                  </div>
                </div>
                <div className="clients-tab__client-summary">
                  <span>{client.subscriptions.length} subscriptions</span>
                  <span>•</span>
                  <span>↓{client.eventsReceived} received</span>
                  <span>•</span>
                  <span>↑{client.eventsSent} sent</span>
                  {client.lastActivity && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(client.lastActivity).toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Боковая панель с деталями */}
        {selectedClient && (
          <div className="clients-tab__details">
            <div className="clients-tab__details-header">
              <h4>Client Details</h4>
              <button
                className="clients-tab__details-close"
                onClick={() => setSelectedClient(null)}
              >
                ✕
              </button>
            </div>
            <div className="clients-tab__details-content">
              {/* Базовая информация */}
              <div className="clients-tab__detail-section">
                <h5>🔍 Basic Info</h5>
                <div className="clients-tab__detail-grid">
                  <div className="clients-tab__detail-item">
                    <span className="clients-tab__detail-label">ID:</span>
                    <code className="clients-tab__detail-value">
                      {selectedClient.id}
                    </code>
                  </div>
                  <div className="clients-tab__detail-item">
                    <span className="clients-tab__detail-label">Type:</span>
                    <span className="clients-tab__detail-value">
                      {selectedClient.type}
                    </span>
                  </div>
                  <div className="clients-tab__detail-item">
                    <span className="clients-tab__detail-label">Status:</span>
                    <span className="clients-tab__detail-value">
                      {selectedClient.status === "active" ? "🟢" : "🔴"}{" "}
                      {selectedClient.status}
                    </span>
                  </div>
                  {selectedClient.lastActivity && (
                    <div className="clients-tab__detail-item">
                      <span className="clients-tab__detail-label">
                        Last Activity:
                      </span>
                      <span className="clients-tab__detail-value">
                        {new Date(selectedClient.lastActivity).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Статистика */}
              <div className="clients-tab__detail-section">
                <h5>📊 Statistics</h5>
                <div className="clients-tab__stats-grid">
                  <div
                    className="clients-tab__stat clients-tab__stat--clickable"
                    onClick={() => {
                      onNavigateToEvents?.("recipient", selectedClient.id);
                    }}
                    title="Click to view events received by this client"
                  >
                    <div className="clients-tab__stat-value">
                      {selectedClient.eventsReceived}
                    </div>
                    <div className="clients-tab__stat-label">
                      Events Received
                    </div>
                  </div>
                  <div
                    className="clients-tab__stat clients-tab__stat--clickable"
                    onClick={() => {
                      onNavigateToEvents?.("source", selectedClient.id);
                    }}
                    title="Click to view events sent by this client"
                  >
                    <div className="clients-tab__stat-value">
                      {selectedClient.eventsSent}
                    </div>
                    <div className="clients-tab__stat-label">Events Sent</div>
                  </div>
                </div>
              </div>

              {/* Подписки */}
              <div className="clients-tab__detail-section">
                <h5>📡 Event Subscriptions</h5>
                {selectedClient.subscriptions.length === 0 ? (
                  <div className="clients-tab__no-subscriptions">
                    No subscriptions
                  </div>
                ) : (
                  <div className="clients-tab__subscription-list">
                    {selectedClient.subscriptions.map((subscription) => (
                      <span
                        key={subscription}
                        className="clients-tab__subscription"
                      >
                        {subscription}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Информация о транспорте */}
              <div className="clients-tab__detail-section">
                <h5>🔗 Transport Details</h5>
                <div className="clients-tab__transport-info">
                  {selectedClient.type === "InMemoryClient" && (
                    <div className="clients-tab__transport-card">
                      <div className="clients-tab__transport-title">
                        🏠 Local Client
                      </div>
                      <div className="clients-tab__transport-desc">
                        In-memory communication within the same window/tab.
                        Direct function calls with no network overhead.
                      </div>
                    </div>
                  )}
                  {selectedClient.type === "PostMessageClient" && (
                    <div className="clients-tab__transport-card">
                      <div className="clients-tab__transport-title">
                        🖼️ PostMessage Client
                      </div>
                      <div className="clients-tab__transport-desc">
                        Cross-frame communication using PostMessage API. Used
                        for iframe-based microfrontends.
                      </div>
                    </div>
                  )}
                  {selectedClient.type === "WebSocketClient" && (
                    <div className="clients-tab__transport-card">
                      <div className="clients-tab__transport-title">
                        🌐 WebSocket Client
                      </div>
                      <div className="clients-tab__transport-desc">
                        Real-time bidirectional communication over WebSocket.
                        Low latency, persistent connection.
                      </div>
                    </div>
                  )}
                  {selectedClient.type === "WorkerClient" && (
                    <div className="clients-tab__transport-card">
                      <div className="clients-tab__transport-title">
                        🛠️ Worker Client
                      </div>
                      <div className="clients-tab__transport-desc">
                        Communication with Web Workers using MessageChannel.
                        Background processing without blocking UI.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
