import React, { useRef, useState, useCallback } from "react";
import type { FC, ReactNode } from "react";
import { ResizableBox } from "react-resizable";
import "./DraggableResizablePanel.css";
import mascotIcon from "../assets/mascote.png";

interface DraggableResizablePanelProps {
  children: ReactNode;
  title: string;
  onClose: () => void;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * 🎛️ Draggable & Resizable Panel - профессиональная реализация
 *
 * Использует:
 * - Нативные mouse events для drag-and-drop
 * - react-resizable для изменения размеров
 * - Умное позиционирование в пределах viewport
 */
export const DraggableResizablePanel: FC<DraggableResizablePanelProps> = ({
  children,
  title,
  onClose,
  initialWidth = 900,
  initialHeight = 600,
  minWidth = 400,
  minHeight = 300,
  maxWidth = window.innerWidth * 0.95,
  maxHeight = window.innerHeight * 0.95,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    // Умное начальное позиционирование
    const centerX = (window.innerWidth - initialWidth) / 2;
    const centerY = (window.innerHeight - initialHeight) / 2;

    return {
      x: Math.max(20, Math.min(centerX, window.innerWidth - initialWidth - 20)),
      y: Math.max(
        20,
        Math.min(centerY, window.innerHeight - initialHeight - 20)
      ),
    };
  });

  const [size, setSize] = useState({
    width: Math.min(initialWidth, maxWidth),
    height: Math.min(initialHeight, maxHeight),
  });

  const [isDragging, setIsDragging] = useState(false);

  // Нативный drag-and-drop с mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Только левая кнопка мыши

      setIsDragging(true);
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      const handleMouseMove = (e: MouseEvent) => {
        const newX = Math.max(
          0,
          Math.min(e.clientX - startX, window.innerWidth - size.width)
        );
        const newY = Math.max(
          0,
          Math.min(e.clientY - startY, window.innerHeight - size.height)
        );

        setPosition({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Предотвращаем выделение текста
      e.preventDefault();
    },
    [position.x, position.y, size.width, size.height]
  );

  // Обработчик изменения размера
  const handleResize = useCallback(
    (event: any, { size: newSize }: any) => {
      const constrainedWidth = Math.min(
        newSize.width,
        window.innerWidth - position.x - 20
      );
      const constrainedHeight = Math.min(
        newSize.height,
        window.innerHeight - position.y - 20
      );

      setSize({
        width: constrainedWidth,
        height: constrainedHeight,
      });
    },
    [position]
  );

  // Обработчик завершения изменения размера
  const handleResizeStop = useCallback(
    (event: any, { size: newSize }: any) => {
      // Дополнительная проверка границ после завершения resize
      const maxAllowedWidth = window.innerWidth - position.x - 20;
      const maxAllowedHeight = window.innerHeight - position.y - 20;

      const finalWidth = Math.min(newSize.width, maxAllowedWidth);
      const finalHeight = Math.min(newSize.height, maxAllowedHeight);

      setSize({
        width: finalWidth,
        height: finalHeight,
      });
    },
    [position]
  );

  return (
    <div
      ref={panelRef}
      className={`draggable-resizable-panel ${isDragging ? "dragging" : ""}`}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 999999,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <ResizableBox
        width={size.width}
        height={size.height}
        minConstraints={[minWidth, minHeight]}
        maxConstraints={[maxWidth, maxHeight]}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        resizeHandles={["se", "s", "e", "sw", "w"]}
        className="resizable-panel"
      >
        <div className="panel-container">
          {/* Заголовок с drag handle */}
          <div
            className="panel-header"
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <div className="panel-title">
              <div className="panel-logo">
                <img
                  src={mascotIcon}
                  alt="EventBroker Mascot"
                  className="panel-logo-mascot"
                />
              </div>
              <span>{title}</span>
            </div>

            <div className="panel-controls">
              <button
                className="panel-control-btn"
                onClick={onClose}
                onMouseDown={(e) => e.stopPropagation()} // Предотвращаем drag при клике на кнопку
                title="Close DevTools"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Содержимое */}
          <div className="panel-content">{children}</div>
        </div>
      </ResizableBox>
    </div>
  );
};
