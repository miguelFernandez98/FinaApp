import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  className?: string;
  style?: React.CSSProperties;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  className,
  style,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);

  const selected = options.find((o) => o.value === value);

  const positionMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  useLayoutEffect(() => {
    if (open) positionMenu();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleResize = () => positionMenu();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  const menu =
    open && menuPos ? (
      createPortal(
        <ul
          ref={menuRef}
          className="custom-select-menu"
          role="listbox"
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
          }}
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className={`custom-select-option ${o.value === value ? "selected" : ""}`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                role="option"
                aria-selected={o.value === value}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )
    ) : null;

  return (
    <div
      ref={containerRef}
      className={`custom-select ${className ?? ""}`}
      style={style}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="custom-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="custom-select-value">{selected?.label ?? ""}</span>
        <i
          className={`fa-solid fa-chevron-down custom-select-chevron ${open ? "open" : ""}`}
        />
      </button>
      {menu}
    </div>
  );
}