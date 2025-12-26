import React, { useEffect, useRef, useState } from "react";
import { Button, Input, Space, Tooltip, Typography, message } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function PdfViewer({ src, className }) {
  const iframeRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setZoom(1);
    setQuery("");
    setFocused(false);
  }, [src]);

  const viewerUrl = `${src}#toolbar=1&navpanes=0&scrollbar=1&zoom=${Math.round(
    zoom * 100
  )}`;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: 10,
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Space>
          <Tooltip title="Zoom in">
            <Button
              icon={<ZoomInOutlined />}
              onClick={() =>
                setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))
              }
            />
          </Tooltip>
          <Tooltip title="Zoom out">
            <Button
              icon={<ZoomOutOutlined />}
              onClick={() =>
                setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))
              }
            />
          </Tooltip>
          <Text>{Math.round(zoom * 100)}%</Text>
        </Space>

        <Space>
          <Input
            allowClear
            placeholder="Nhập từ cần tìm (PDF dùng Ctrl+F)"
            prefix={<SearchOutlined />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={async () => {
              const q = String(query || "").trim();
              if (!q) return;

              try {
                await navigator.clipboard.writeText(q);
                message.success("Đã copy từ khóa. Bấm Ctrl+F trong PDF để dán tìm.");
              } catch {
                message.info("Bấm Ctrl+F trong PDF để tìm. (Không copy được từ khóa) ");
              }

              try {
                iframeRef.current?.focus?.();
                iframeRef.current?.contentWindow?.focus();
                setFocused(true);
              } catch {
                setFocused(true);
              }
            }}
            style={{ width: 320 }}
          />
          <Button
            type={focused ? "primary" : "default"}
            onClick={() => {
              try {
                iframeRef.current?.focus?.();
                iframeRef.current?.contentWindow?.focus();
                setFocused(true);
              } catch {
                setFocused(true);
              }
            }}
          >
            {focused ? "PDF đang focus" : "Focus PDF"}
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <iframe
          ref={iframeRef}
          title="pdf-viewer"
          src={viewerUrl}
          className="w-full h-full border-none"
          style={{ width: "100%", height: "100%", border: "none" }}
          onLoad={() => setFocused(false)}
          onMouseDown={() => setFocused(true)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          tabIndex={0}
        />
      </div>
    </div>
  );
}
