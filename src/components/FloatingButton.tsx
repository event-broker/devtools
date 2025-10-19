import React from "react";
import type { FC } from "react";
import type { DevToolsPosition } from "../types";
import "./FloatingButton.css";
import mascotIcon from "../assets/mascote.png";

interface FloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  position: DevToolsPosition;
  isConnected?: boolean;
  onPositionChange?: (position: DevToolsPosition) => void;
}

/**
 * 🎛️ Плавающая кнопка DevTools - в стиле React Query DevTools
 */
export const FloatingButton: FC<FloatingButtonProps> = ({
  isOpen,
  onClick,
  position,
  isConnected = false,
  onPositionChange,
}) => {
  // Для docked режимов показываем кнопку только когда панель закрыта
  // Для floating режима показываем всегда
  const shouldShow = position === "floating" || !isOpen;

  if (!shouldShow) {
    return null;
  }

  const getPositionClass = () => {
    switch (position) {
      case "bottom":
        return "devtools-floating-button--bottom";
      case "left":
        return "devtools-floating-button--left";
      case "right":
        return "devtools-floating-button--right";
      case "floating":
        return "devtools-floating-button--floating";
      default:
        return "devtools-floating-button--bottom";
    }
  };

  return (
    <div className={`devtools-floating-button ${getPositionClass()}`}>
      <button
        className={`
          devtools-floating-button__btn
          ${isOpen ? "devtools-floating-button__btn--open" : ""}
          ${
            isConnected
              ? "devtools-floating-button__btn--connected"
              : "devtools-floating-button__btn--disconnected"
          }
        `}
        onClick={onClick}
        title={
          isOpen ? "Close EventBroker DevTools" : "Open EventBroker DevTools"
        }
      >
        {/* Иконка маскота (сова) */}
        <img
          src={mascotIcon}
          alt="EventBroker DevTools"
          className="devtools-floating-button__mascot"
        />

        {/* Индикатор подключения */}
        <div
          className={`
            devtools-floating-button__status
            ${
              isConnected
                ? "devtools-floating-button__status--connected"
                : "devtools-floating-button__status--disconnected"
            }
          `}
        />
      </button>
    </div>
  );
};
