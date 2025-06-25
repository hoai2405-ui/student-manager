import { useEffect, useState } from "react";
import { Table, Card, Spin } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";


const STATUS_LABELS = {
  dat: "Đạt",
  rot: "Rớt",
  vang: "Vắng",
  thi: "Đang thi",
  "chua thi": "Chưa thi",
};
const COLOR_MAP = {
  dat: "#52c41a",
  rot: "#ff4d4f",
  vang: "#faad14",
  thi: "#1890ff",
  "chua thi": "#bfbfbf",
};
const STATUS_FIELDS = [
  { key: "status_ly_thuyet", label: "Lý thuyết" },
  { key: "status_mo_phong", label: "Mô phỏng" },
  { key: "status_duong", label: "Đường" },
  { key: "status_truong", label: "Hình" },
];



const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  
  name,
  value,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 24; // label ra ngoài hơn
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Chỉ vẽ label nếu chiếm > 2%
  if (percent < 0.02) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#333"
      fontSize={14}
      fontWeight={500}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${name}: ${value}`}
    </text>
  );
};

export default function StatsPage() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/stats").then((res) => {
      setStats(res.data);
      setLoading(false);
    });
  }, []);

  // Chuyển stats về dạng dễ render bảng & biểu đồ
  const buildStatsTable = () => {
    // { status_ly_thuyet: {dat: 5, rot: 2, ...}, status_mo_phong: {...}, ... }
    const result = {};
    for (const f of STATUS_FIELDS) result[f.key] = {};
    for (const s of stats) {
      if (s.type && typeof s.status === "string" && result[s.type]) {
        result[s.type][s.status] = s.count;
      }
    }

    // Tìm all trạng thái từng xuất hiện
    const allStatus = Array.from(new Set(stats.map((x) => x.status))).filter(
      Boolean
    );
    return { result, allStatus };
  };

  const { result, allStatus } = buildStatsTable();

  // Tạo dữ liệu bảng
  const dataSource = allStatus.map((status) => {
    const row = { key: status, status: STATUS_LABELS[status] || status };
    for (const f of STATUS_FIELDS) {
      row[f.key] = result[f.key][status] || 0;
    }
    return row;
  });

  // Tạo cột bảng
  const columns = [
    { title: "Trạng thái", dataIndex: "status", key: "status" },
    ...STATUS_FIELDS.map((f) => ({
      title: f.label,
      dataIndex: f.key,
      key: f.key,
    })),
  ];

  
  

  return (
    <div style={{ maxWidth: 1100, margin: "32px auto" }}>
      <Card title="Thống kê trạng thái học viên" style={{ borderRadius: 16 }}>
        {loading ? (
          <Spin />
        ) : (
          <>
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              bordered
              style={{ marginBottom: 32 }}
              rowKey={(r) => r.key}
            />
            <div
              style={{
                display: "flex",
                gap: 30,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {STATUS_FIELDS.map((f) => {
                const dataPie = allStatus
                  .map((st) => ({
                    name: STATUS_LABELS[st] || st,
                    value: result[f.key][st] || 0,
                  }))
                  .filter((x) => x.value > 0);

                return (
                  <div key={f.key} style={{ width: 350, textAlign: "center", marginBottom: 32 }}>
                    <div style={{ fontWeight: "bold", marginBottom: 8 }}>{f.label}</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={dataPie}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          fill="#82ca9d"
                          label={renderCustomLabel}
                          labelLine={false}
                        >
                          {dataPie.map((entry, idx) => (
                            <Cell
                              key={`${f.key}-${entry.name}-${idx}`}
                              fill={
                                COLOR_MAP[
                                  Object.keys(STATUS_LABELS).find((k) => STATUS_LABELS[k] === entry.name)
                                ] || "#8884d8"
                              }
                            />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

