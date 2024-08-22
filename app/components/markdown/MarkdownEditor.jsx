import { useState, useRef, useEffect } from "react";
export default function MarkdownEditor({ value, onChange, name }) {
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [menuPoint, setMenuPoint] = useState({ x: 0, y: 0 });
  const contextMenu = useRef(null);
  const rightClickMenu = (event) => {
    event.preventDefault();
    // 打开菜单
    setContextMenuVisible(true);
    setMenuPoint({ x: event.clientX, y: event.clientY });
  };
  const handleClickOutside = (event) => {
    if (contextMenu.current && !contextMenu.current.contains(event.target)) {
      setContextMenuVisible(false);
    }
  };
  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  return (
    <>
      <textarea
        name={name}
        onContextMenu={rightClickMenu}
        rows="50"
        value={value}
        type="text"
        onChange={onChange}
        style={{ width: '100%', resize: "none", padding: 10, boxSizing: 'border-box' }}
      />
      {contextMenuVisible && (
        <div
          ref={contextMenu}
          style={{
            position: "fixed",
            top: menuPoint.y,
            left: menuPoint.x,
            background: "red",
          }}
        >
          <div>标题</div>
          <div>引用</div>
          <div>强调</div>
        </div>
      )}
    </>
  );
}
