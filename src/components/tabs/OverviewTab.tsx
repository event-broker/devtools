import React from "react";
import type { FC } from "react";
import type { DevToolsState } from "../../types";
import "./OverviewTab.css";

interface OverviewTabProps {
  state: DevToolsState;
}

/**
 * 📊 Overview Tab - общий обзор системы
 */
export const OverviewTab: FC<OverviewTabProps> = ({ state }) => {
  const { clients, metrics, deliveryStats } = state;

  // Определяем здоровье системы
  const health = (() => {
    if (!state.isConnected) {
      return { label: "Disconnected", color: "#ef4444" };
    }

    // Минимальное количество событий для оценки здоровья
    const totalEvents = deliveryStats.acks.total + deliveryStats.nacks.total;
    const minEventsForHealth = 2;

    if (totalEvents < minEventsForHealth) {
      return { label: "—", color: "#6b7280" };
    }

    if (deliveryStats.successRate >= 0.8) {
      return { label: "Healthy", color: "#22c55e" };
    }
    if (deliveryStats.successRate >= 0.7) {
      return { label: "Warning", color: "#f59e0b" };
    }
    return { label: "Critical", color: "#ef4444" };
  })();

  const formatMemory = (memory: string | number): string => {
    if (typeof memory === "string") return memory;
    const mb = memory / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="overview-tab">
      {/* Live Metrics with System Health */}
      <div className="overview-tab__section">
        <h3 className="overview-tab__section-title">📊 Live Metrics</h3>
        <div className="overview-tab__metrics">
          {/* System Health as first metric */}
          <div
            className="overview-tab__metric"
            title="System health status: — (< 5 events), Healthy (≥80%), Warning (≥70%), Critical (<70%)"
          >
            <div
              className="overview-tab__metric-value"
              style={{ color: health.color }}
            >
              <div
                className="overview-tab__health-indicator"
                style={{
                  backgroundColor: health.color,
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  display: "inline-block",
                  marginRight: "8px",
                }}
              />
              {health.label}
            </div>
            <div className="overview-tab__metric-label">System Health</div>
          </div>

          <div
            className="overview-tab__metric"
            title="Number of currently connected and active clients"
          >
            <div className="overview-tab__metric-value">{clients.length}</div>
            <div className="overview-tab__metric-label">Active Clients</div>
          </div>

          <div
            className="overview-tab__metric"
            title="Percentage of events that were successfully delivered and acknowledged"
          >
            <div className="overview-tab__metric-value">
              {(deliveryStats.successRate * 100).toFixed(1)}%
            </div>
            <div className="overview-tab__metric-label">Success Rate</div>
          </div>

          <div
            className="overview-tab__metric"
            title="Current JavaScript heap memory usage"
          >
            <div className="overview-tab__metric-value">
              {formatMemory(metrics.memoryUsage)}
            </div>
            <div className="overview-tab__metric-label">Memory</div>
          </div>
        </div>
      </div>

      {/* Delivery Statistics */}
      <div className="overview-tab__section">
        <h3 className="overview-tab__section-title">📈 Delivery Statistics</h3>
        <div className="overview-tab__delivery">
          <div
            className="overview-tab__delivery-stat"
            title="Number of successfully acknowledged events"
          >
            <div className="overview-tab__delivery-value">
              {deliveryStats.acks.total}
            </div>
            <div className="overview-tab__delivery-label">ACKs</div>
          </div>

          <div
            className="overview-tab__delivery-stat"
            title="Number of failed or unacknowledged events"
          >
            <div className="overview-tab__delivery-value">
              {deliveryStats.nacks.total}
            </div>
            <div className="overview-tab__delivery-label">NACKs</div>
          </div>

          <div
            className="overview-tab__delivery-stat"
            title="Total number of delivery attempts made"
          >
            <div className="overview-tab__delivery-value">
              {deliveryStats.acks.total + deliveryStats.nacks.total}
            </div>
            <div className="overview-tab__delivery-label">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};
