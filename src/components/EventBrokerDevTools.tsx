import React, { useEffect, useState, useCallback } from "react";
import type { FC } from "react";
import type { EventBroker } from "../external-types";
import { DevToolsManager } from "../DevToolsManager";
import { FloatingButton } from "./FloatingButton";
import { DevToolsPanel } from "./DevToolsPanel";
import { DraggableResizablePanel } from "./DraggableResizablePanel";
import type {
  DevToolsConfig,
  DevToolsState,
  DevToolsPosition,
  EventMetadata,
} from "../types";

interface EventBrokerDevToolsProps {
  broker: EventBroker<any, any, any>;
  config?: Partial<DevToolsConfig>;
  enabled?: boolean;
}

/**
 * 🎛️ EventBroker DevTools - главный компонент
 *
 * Использование:
 * ```tsx
 * <EventBrokerDevTools
 *   broker={broker}
 *   config={{ position: 'bottom-right' }}
 * />
 * ```
 */
export const EventBrokerDevTools: FC<EventBrokerDevToolsProps> = ({
  broker,
  config = {},
  enabled = process.env.NODE_ENV === "development",
}) => {
  const [manager] = useState(() => new DevToolsManager(config));
  const [state, setState] = useState<DevToolsState>(manager.getState());

  // Подписка на изменения состояния
  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  // Подключение к брокеру
  useEffect(() => {
    if (!enabled) return;

    const cleanup = manager.attachTo(broker);
    return cleanup;
  }, [broker, manager, enabled]);

  // Обработчики событий
  const handleToggle = useCallback(() => {
    manager.updateSettings({
      isOpen: !state.settings.isOpen,
    });
  }, [manager, state.settings.isOpen]);

  const handleClose = useCallback(() => {
    manager.updateSettings({ isOpen: false });
  }, [manager]);

  const handleSettingsUpdate = useCallback(
    (updates: Partial<DevToolsState["settings"]>) => {
      manager.updateSettings(updates);
    },
    [manager]
  );

  const handleClearEvents = useCallback(() => {
    manager.clearEvents();
  }, [manager]);

  const handleSendTestMessage = useCallback(
    (
      eventType: string,
      data: any,
      options?: { recipient?: string; source?: string }
    ) => {
      manager.sendTestMessage(eventType, data, options);
    },
    [manager]
  );

  const handlePositionChange = useCallback(
    (position: DevToolsPosition) => {
      manager.updateSettings({ position });
    },
    [manager]
  );

  // Не рендерим в продакшене или если отключено
  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Плавающая кнопка */}
      <FloatingButton
        isOpen={state.settings.isOpen}
        onClick={handleToggle}
        position={state.settings.position}
        isConnected={state.isConnected}
        onPositionChange={handlePositionChange}
      />

      {/* DevTools панель */}
      {state.settings.isOpen && (
        <DraggableResizablePanel
          title="EventBroker DevTools"
          onClose={handleClose}
          initialWidth={900}
          initialHeight={600}
          minWidth={400}
          minHeight={300}
        >
          <DevToolsPanel
            state={state}
            onClose={handleClose}
            onSettingsUpdate={handleSettingsUpdate}
            onClearEvents={handleClearEvents}
            onSendTestMessage={handleSendTestMessage}
            availableEvents={config?.availableEvents}
          />
        </DraggableResizablePanel>
      )}
    </>
  );
};
