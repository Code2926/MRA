import React from "react";
import {
  FaBoxes,
  FaShoppingCart,
  FaFileInvoice,
  FaChartLine,
  FaUser,
  FaClock,
  FaWarehouse,
  FaDownload,
  FaFileExcel,
} from "react-icons/fa";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

const Reports = () => {
  const logs = [
    {
      type: "STOCK_IN",
      item: "CG125 Brake",
      qty: 50,
      ref: "Manual Add",
      time: "Today 10:30 AM",
    },
    {
      type: "STOCK_OUT",
      item: "CD70 Clutch",
      qty: 3,
      ref: "Bill #10021 (Ali Traders)",
      time: "Today 11:10 AM",
    },
    {
      type: "STOCK_OUT",
      item: "CG125 Meter",
      qty: 2,
      ref: "Bill #10020 (City Auto)",
      time: "Yesterday 5:20 PM",
    },
    {
      type: "STOCK_IN",
      item: "CD70 Brake",
      qty: 100,
      ref: "Purchase Entry",
      time: "Yesterday 2:10 PM",
    },
  ];

  return (
    <div className="space-y-6">

      {/* 🔥 HEADER */}
      <div className="bg-black text-white rounded-3xl p-6">

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaWarehouse /> Inventory Control Center
          </h2>

          <p className="text-gray-400 text-sm flex items-center gap-2">
            <FaClock /> Real-time Ledger
          </p>
        </div>

        <p className="text-gray-500 text-sm mt-2">
          Tracks every stock movement from Inventory & Billing system (Supabase synced)
        </p>

      </div>

      {/* 📊 KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-black text-white rounded-3xl p-5">
          <FaBoxes className="text-gray-400" />
          <p className="text-gray-400 text-sm mt-2">Stock In</p>
          <h1 className="text-2xl font-bold text-green-400">12,400</h1>
        </div>

        <div className="bg-black text-white rounded-3xl p-5">
          <FaShoppingCart className="text-gray-400" />
          <p className="text-gray-400 text-sm mt-2">Stock Out</p>
          <h1 className="text-2xl font-bold text-red-400">8,120</h1>
        </div>

        <div className="bg-black text-white rounded-3xl p-5">
          <FaFileInvoice className="text-gray-400" />
          <p className="text-gray-400 text-sm mt-2">Total Bills</p>
          <h1 className="text-2xl font-bold">1,024</h1>
        </div>

        <div className="bg-black text-white rounded-3xl p-5">
          <FaChartLine className="text-gray-400" />
          <p className="text-gray-400 text-sm mt-2">Net Stock</p>
          <h1 className="text-2xl font-bold text-green-400">+4,280</h1>
        </div>

      </div>

      {/* 📊 REAL RECHARTS GRAPH */}
      <div className="bg-black text-white rounded-3xl p-6">

        <h2 className="text-xl font-bold mb-4">Stock Movement Trend</h2>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { day: "Mon", in: 30, out: 20 },
                { day: "Tue", in: 50, out: 35 },
                { day: "Wed", in: 40, out: 25 },
                { day: "Thu", in: 80, out: 60 },
                { day: "Fri", in: 65, out: 50 },
                { day: "Sat", in: 90, out: 70 },
                { day: "Sun", in: 60, out: 45 },
              ]}
            >

              <XAxis dataKey="day" stroke="#9CA3AF" />

              <Tooltip
                contentStyle={{ backgroundColor: "#111", border: "none" }}
              />

              <Area
                type="monotone"
                dataKey="in"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />

              <Area
                type="monotone"
                dataKey="out"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
              />

            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 📥 DOWNLOAD SECTION (FUTURE FEATURE MOCKUP) */}
      <div className="bg-black text-white rounded-3xl p-6">

        <h2 className="text-xl font-bold mb-4">Reports Export</h2>

        <div className="flex flex-col md:flex-row gap-4">

          <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl">
            <FaFileExcel /> Download Monthly Report
          </button>

          <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl">
            <FaDownload /> Download Yearly Report
          </button>

        </div>

        <p className="text-gray-500 text-xs mt-3">
          (Future feature: PDF / Excel export from Supabase data)
        </p>

      </div>

      {/* 📜 LEDGER */}
      <div className="bg-black text-white rounded-3xl p-6">

        <h2 className="text-xl font-bold mb-4">Inventory Ledger</h2>

        <div className="space-y-3">

          {logs.map((log, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-gray-900 p-4 rounded-xl"
            >

              {/* LEFT */}
              <div className="flex items-center gap-3">

                <div>
                  <p className="font-medium">{log.item}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <FaUser /> {log.ref}
                  </p>
                </div>

              </div>

              {/* RIGHT */}
              <div className="text-right">

                <p className="text-sm">Qty: {log.qty}</p>
                <p className="text-xs text-gray-500">{log.time}</p>

                <span
                  className={`text-xs px-3 py-1 rounded-full mt-1 inline-block ${
                    log.type === "STOCK_IN"
                      ? "bg-green-500 text-black"
                      : "bg-red-500 text-black"
                  }`}
                >
                  {log.type.replace("_", " ")}
                </span>

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
};

export default Reports;