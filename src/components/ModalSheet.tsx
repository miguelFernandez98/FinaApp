import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react";

interface ModalSheetProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

interface DragState {
  startY: number;
  dy: number;
  active: boolean;
  fromHandle: boolean;
}

export default function ModalSheet({
  onClose,
  children,
  className = "",
}: ModalSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({
    startY: 0,
    dy: 0,
    active: false,
    fromHandle: false,
  });
  const closingRef = useRef(false);

  const applyDrag = (dy: number) => {
    const sheet = sheetRef.current;
    const overlay = overlayRef.current;
    if (!sheet) return;
    sheet.style.transition = "none";
    sheet.style.transform = `translateY(${dy}px)`;
    if (overlay) {
      overlay.style.opacity = String(Math.max(0.4, 1 - dy / (sheet.offsetHeight * 0.8)));
    }
  };

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    const sheet = sheetRef.current;
    const overlay = overlayRef.current;
    if (!sheet) return;
    const threshold = Math.max(120, sheet.offsetHeight * 0.2);
    if (drag.dy > threshold) {
      closingRef.current = true;
      sheet.style.transition = "transform 0.3s cubic-bezier(0.32, 0, 0.67, 0)";
      sheet.style.transform = "translateY(100%)";
      if (overlay) overlay.style.opacity = "0";
      window.setTimeout(onClose, 280);
    } else {
      sheet.style.transition = "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)";
      sheet.style.transform = "translateY(0)";
      if (overlay) overlay.style.opacity = "1";
    }
    drag.dy = 0;
  }, [onClose]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onTouchMove = (e: TouchEvent) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const dy = e.touches[0].clientY - drag.startY;
      if (dy <= 0) return;
      if (sheet.scrollTop > 0 && !drag.fromHandle) return;
      e.preventDefault();
      drag.dy = dy;
      applyDrag(dy);
    };

    const onTouchEnd = () => endDrag();

    const onWinPointerMove = (e: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const dy = e.clientY - drag.startY;
      if (dy <= 0) return;
      drag.dy = dy;
      applyDrag(dy);
    };

    const onWinPointerUp = () => endDrag();

    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd);
    sheet.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("pointermove", onWinPointerMove);
    window.addEventListener("pointerup", onWinPointerUp);
    window.addEventListener("pointercancel", onWinPointerUp);
    return () => {
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("pointermove", onWinPointerMove);
      window.removeEventListener("pointerup", onWinPointerUp);
      window.removeEventListener("pointercancel", onWinPointerUp);
    };
  }, [endDrag]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const sheet = sheetRef.current;
    if (!sheet || closingRef.current) return;
    const fromHandle = (e.target as HTMLElement).classList.contains("modal-handle");
    if (sheet.scrollTop > 0 && !fromHandle) return;
    dragRef.current = {
      startY: e.clientY,
      dy: 0,
      active: true,
      fromHandle,
    };
  };

  return (
    <div
      ref={overlayRef}
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget && !closingRef.current) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className={`modal-sheet ${className}`.trim()}
        onPointerDown={handlePointerDown}
      >
        <div className="modal-handle" />
        {children}
      </div>
    </div>
  );
}