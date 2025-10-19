import React, { useState, useCallback } from "react";
import type { FC } from "react";
import type { DevToolsState, EventMetadata } from "../types";
import { OverviewTab } from "./tabs/OverviewTab";
import { EventsTab } from "./tabs/EventsTab";
import { ClientsTab } from "./tabs/ClientsTab";
import { DebugTab } from "./tabs/DebugTab";
import "./DevToolsPanel.css";

interface DevToolsPanelProps {
  state: DevToolsState;
  onClose: () => void;
  onSettingsUpdate: (updates: Partial<DevToolsState["settings"]>) => void;
  onClearEvents: () => void;
  onSendTestMessage?: (
    eventType: string,
    data: any,
    options?: { recipient?: string; source?: string }
  ) => void;
  availableEvents?: EventMetadata[];
}

/**
 * 🎛️ Главная панель DevTools
 */
export const DevToolsPanel: FC<DevToolsPanelProps> = ({
  state,
  onClose,
  onSettingsUpdate,
  onClearEvents,
  onSendTestMessage,
  availableEvents,
}) => {
  const handleTabClick = (tab: DevToolsState["settings"]["activeTab"]) => {
    onSettingsUpdate({ activeTab: tab });
  };

  // 🔄 Навигация с фильтрами между табами
  const switchToEventsWithFilter = useCallback(
    (filterType: "recipient" | "source", clientId: string) => {
      // Переключаемся на Events таб
      const newSettings = {
        activeTab: "events" as const,
        // Устанавливаем фильтр по получателю или отправителю
        eventFilters: {
          types: [],
          sources: filterType === "source" ? [clientId] : [],
          recipients: filterType === "recipient" ? [clientId] : [],
          status: [],
        },
      };

      onSettingsUpdate(newSettings);
    },
    [onSettingsUpdate]
  );

  const tabs = [
    { id: "overview" as const, label: "📊 Overview", count: undefined },
    { id: "events" as const, label: "🔄 Events", count: state.events.length },
    {
      id: "clients" as const,
      label: "👥 Clients",
      count: state.clients.length,
    },
    { id: "debug" as const, label: "🐛 Debug", count: undefined },
  ];

  const renderActiveTab = () => {
    switch (state.settings.activeTab) {
      case "overview":
        return <OverviewTab state={state} />;
      case "events":
        return (
          <EventsTab
            events={state.events}
            settings={state.settings}
            clients={state.clients}
            onSettingsUpdate={onSettingsUpdate}
            onClearEvents={onClearEvents}
          />
        );
      case "clients":
        return (
          <ClientsTab
            clients={state.clients}
            onNavigateToEvents={switchToEventsWithFilter}
          />
        );
      case "debug":
        return (
          <DebugTab
            state={state}
            onClearEvents={onClearEvents}
            onSendTestMessage={onSendTestMessage}
            availableEvents={availableEvents}
          />
        );
      default:
        return <OverviewTab state={state} />;
    }
  };

  return (
    <div className="devtools-panel-content">
      {/* Навигационные вкладки */}
      <div className="devtools-panel__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              devtools-panel__tab
              ${
                state.settings.activeTab === tab.id
                  ? "devtools-panel__tab--active"
                  : ""
              }
            `}
            onClick={() => handleTabClick(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="devtools-panel__tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Содержимое активной вкладки */}
      <div className="devtools-panel__content">{renderActiveTab()}</div>

      {/* Статус бар */}
      <div className="devtools-panel__statusbar">
        <div className="devtools-panel__statusbar-item">
          Last update: {new Date(state.lastUpdate).toLocaleTimeString()}
        </div>
        <div className="devtools-panel__statusbar-item">
          Events: {state.events.length}
        </div>
        <div className="devtools-panel__statusbar-item">
          Clients: {state.clients.length}
        </div>
        <div
          className={`devtools-panel__statusbar-item ${
            state.isConnected
              ? "devtools-panel__statusbar-item--success"
              : "devtools-panel__statusbar-item--error"
          }`}
        >
          {state.isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
    </div>
  );
};
