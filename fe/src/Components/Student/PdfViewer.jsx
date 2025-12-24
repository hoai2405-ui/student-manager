import React, { useEffect, useRef, useState } from "react";
import { Button, Input, Space, Tooltip, Typography } from "antd";
import { ZoomInOutlined, ZoomOutOutlined, SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function PdfViewer({ src, className }) {
  const iframeRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setZoom(1);
    setQuery("");
  }, [src]);

  const viewerUrl = `${src}#toolbar=1&navpanes=0&scrollbar=1&zoom=${Math.round(zoom * 100)}`;

  return (
    <div className={className} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 10, borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", gap: 12 }}>
        <Space>
          <Tooltip title="Zoom in">
            <Button icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))} />
          </Tooltip>
          <Tooltip title="Zoom out">
            <Button icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))} />
          </Tooltip>
          <Text>{Math.round(zoom * 100)}%</Text>
        </Space>

        <Space>
          <Input
            allowClear
            placeholder="Tìm (trình duyệt sẽ highlight trong PDF nếu hỗ trợ)"
            prefix={<SearchOutlined />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 320 }}
          />
          <Button
            onClick={() => {
              // Best-effort: rely on browser PDF search (Ctrl+F) if iframe is focused
              try {
                iframeRef.current?.contentWindow?.focus();
              } catch {
                // ignore
              }
            }}
          >
            Focus PDF
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
        />
      </div>
    </div>
  );
}
