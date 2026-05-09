import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import {
  FaBox,
  FaExclamationTriangle,
  FaShoppingCart,
  FaWarehouse,
  FaSyncAlt,
  FaFileInvoice,
  FaChartLine,
} from "react-icons/fa";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* COLORS */
const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

/* FORMAT LARGE NUMBERS */
const formatNumber = (num) => {
  const value = Number(num || 0);

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value;
};

/* CUSTOM TOOLTIP */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="
          rounded-2xl border border-gray-200 dark:border-white/10
          bg-white dark:bg-[#111]
          px-4 py-3 shadow-xl
        "
      >
        <p className="font-semibold text-black dark:text-white">
          {label}
        </p>

        <p className="text-sm text-green-500">
          Revenue: Rs {formatNumber(payload[0].value)}
        </p>
      </div>
    );
  }

  return null;
};

/* CARD */
const Card = ({
  title,
  value,
  icon,
  trend,
  danger,
}) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="
        relative overflow-hidden rounded-3xl
        border border-gray-200 dark:border-white/10
        bg-white dark:bg-[#0b0b0b]
        shadow-sm hover:shadow-xl
        p-5
        transition-all duration-300
      "
    >
      {/* GLOW */}
      <div
        className={`
          absolute -top-10 -right-10 h-40 w-40 blur-3xl opacity-20
          ${danger ? "bg-red-500" : "bg-green-500"}
        `}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">

        {/* LEFT */}
        <div className="min-w-0 flex-1">

          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-white/50">
            {title}
          </p>

          <h2
            className="
              mt-3 text-2xl sm:text-3xl
              font-black
              text-black dark:text-white
              truncate
            "
          >
            {formatNumber(value)}
          </h2>

          <div
            className={`
              mt-4 inline-flex items-center
              px-3 py-1 rounded-full
              text-xs font-bold
              ${
                danger
                  ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
              }
            `}
          >
            {trend}
          </div>

        </div>

        {/* ICON */}
        <div
          className={`
            h-14 w-14 rounded-2xl
            flex items-center justify-center
            text-xl shrink-0
            ${
              danger
                ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                : "bg-gray-100 text-black dark:bg-white/10 dark:text-white"
            }
          `}
        >
          {icon}
        </div>

      </div>
    </motion.div>
  );
};

/* MAIN */
export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalSales: 0,
    totalBills: 0,
    lowStock: 0,
  });

  const [recentBills, setRecentBills] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [pieData, setPieData] = useState([]);

  /* FETCH DASHBOARD */
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [productsRes, billsRes] = await Promise.all([
        supabase
          .from("products")
          .select("*"),

        supabase
          .from("bills")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .limit(10),
      ]);

      if (productsRes.error) {
        throw productsRes.error;
      }

      if (billsRes.error) {
        throw billsRes.error;
      }

      const products = productsRes.data || [];
      const bills = billsRes.data || [];

      /* TOTALS */
      const totalStock = products.reduce(
        (sum, item) => sum + Number(item.stock || 0),
        0
      );

      const totalSales = bills.reduce(
        (sum, bill) => sum + Number(bill.total_amount || 0),
        0
      );

      const lowStock = products.filter(
        (item) => Number(item.stock || 0) <= 5
      );

      setStats({
        totalProducts: products.length,
        totalStock,
        totalSales,
        totalBills: bills.length,
        lowStock: lowStock.length,
      });

      setRecentBills(bills);
      setLowStockItems(lowStock);

      /* WEEKLY */
      const days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ];

      const weeklyMap = {};

      bills.forEach((bill) => {
        const day =
          days[new Date(bill.created_at).getDay()];

        weeklyMap[day] =
          (weeklyMap[day] || 0) +
          Number(bill.total_amount || 0);
      });

      setWeeklyData(
        days.map((day) => ({
          name: day,
          sales: weeklyMap[day] || 0,
        }))
      );

      /* PIE */
      setPieData(
        products.map((item) => ({
          name: item.product_name,
          value: Number(item.stock || 0),
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  /* LOADING */
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="
              h-32 rounded-3xl
              bg-gray-200 dark:bg-white/5
              animate-pulse
            "
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="
        space-y-6
        text-black dark:text-white
        transition-colors duration-300
      "
    >

      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>
          <h1
            className="
              text-3xl sm:text-4xl
              font-black
              text-black dark:text-white
            "
          >
            Dashboard
          </h1>

          <p className="text-gray-500 dark:text-white/50 text-sm mt-1">
            Real-time analytics overview
          </p>
        </div>

        {/* REFRESH */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.03 }}
          onClick={fetchDashboard}
          className="
            flex items-center gap-2
            px-5 py-3 rounded-2xl
            border border-gray-200 dark:border-white/10
            bg-gray-100 dark:bg-white/5
            hover:bg-gray-200 dark:hover:bg-white/10
            text-black dark:text-white
            transition-all duration-300
          "
        >
          <FaSyncAlt />
          Refresh
        </motion.button>

      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

        <Card
          title="Products"
          value={stats.totalProducts}
          icon={<FaBox />}
          trend="+12%"
        />

        <Card
          title="Stock"
          value={stats.totalStock}
          icon={<FaWarehouse />}
          trend="+8%"
        />

        <Card
          title="Revenue"
          value={stats.totalSales}
          icon={<span className="font-bold">Rs</span>}
          trend="+24%"
        />

        <Card
          title="Bills"
          value={stats.totalBills}
          icon={<FaShoppingCart />}
          trend="+5%"
        />

        <Card
          title="Low Stock"
          value={stats.lowStock}
          icon={<FaExclamationTriangle />}
          trend="Alert"
          danger
        />

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">

        {/* REVENUE CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            2xl:col-span-2
            p-6 rounded-3xl
            border border-gray-200 dark:border-white/10
            bg-white dark:bg-[#0b0b0b]
            shadow-sm
          "
        >

          <div className="flex items-center gap-3 mb-5">
            <div
              className="
                h-11 w-11 rounded-2xl
                bg-green-100 dark:bg-green-500/10
                text-green-600 dark:text-green-400
                flex items-center justify-center
              "
            >
              <FaChartLine />
            </div>

            <div>
              <h2 className="font-bold text-lg">
                Weekly Revenue
              </h2>

              <p className="text-sm text-gray-500 dark:text-white/50">
                Revenue analytics
              </p>
            </div>
          </div>

          <div className="h-[320px]">

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>

                <defs>
                  <linearGradient
                    id="colorRevenue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#22c55e"
                      stopOpacity={0.8}
                    />

                    <stop
                      offset="95%"
                      stopColor="#22c55e"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.1}
                />

                <XAxis
                  dataKey="name"
                  stroke="#888"
                />

                <YAxis
                  stroke="#888"
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={3}
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>

        </motion.div>

        {/* PIE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            p-6 rounded-3xl
            border border-gray-200 dark:border-white/10
            bg-white dark:bg-[#0b0b0b]
            shadow-sm
          "
        >

          <h2 className="font-bold text-lg mb-5">
            Stock Distribution
          </h2>

          <div className="h-[320px]">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={pieData}
                  dataKey="value"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={3}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

          </div>

        </motion.div>

      </div>

      {/* LOWER GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* LOW STOCK */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="
            p-6 rounded-3xl
            border border-gray-200 dark:border-white/10
            bg-white dark:bg-[#0b0b0b]
            shadow-sm
          "
        >

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="font-bold text-lg">
                Low Stock
              </h2>

              <p className="text-sm text-gray-500 dark:text-white/50">
                Products needing refill
              </p>
            </div>

            <div
              className="
                h-11 w-11 rounded-2xl
                bg-red-100 dark:bg-red-500/10
                text-red-600 dark:text-red-400
                flex items-center justify-center
              "
            >
              <FaExclamationTriangle />
            </div>

          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">

            {lowStockItems.length === 0 ? (
              <div
                className="
                  p-6 rounded-2xl
                  bg-gray-100 dark:bg-white/5
                  text-center
                "
              >
                <p className="text-gray-500 dark:text-white/50">
                  No low stock items
                </p>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  key={item.id}
                  className="
                    p-4 rounded-2xl
                    border border-red-200 dark:border-red-500/10
                    bg-red-50 dark:bg-red-500/5
                    transition-all duration-300
                  "
                >

                  <div className="flex justify-between items-start gap-4">

                    <div className="min-w-0">

                      <p className="font-bold text-black dark:text-white truncate">
                        {item.product_name}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-white/50 mt-1">
                        {item.bike_type} • {item.model || "N/A"}
                      </p>

                    </div>

                    <div
                      className="
                        px-3 py-1 rounded-full
                        bg-red-100 dark:bg-red-500/10
                        text-red-600 dark:text-red-400
                        text-sm font-bold
                        shrink-0
                      "
                    >
                      {item.stock} left
                    </div>

                  </div>

                </motion.div>
              ))
            )}

          </div>

        </motion.div>

        {/* RECENT BILLS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="
            p-6 rounded-3xl
            border border-gray-200 dark:border-white/10
            bg-white dark:bg-[#0b0b0b]
            shadow-sm
          "
        >

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="font-bold text-lg">
                Recent Bills
              </h2>

              <p className="text-sm text-gray-500 dark:text-white/50">
                Latest 10 invoices
              </p>
            </div>

            <div
              className="
                h-11 w-11 rounded-2xl
                bg-blue-100 dark:bg-blue-500/10
                text-blue-600 dark:text-blue-400
                flex items-center justify-center
              "
            >
              <FaFileInvoice />
            </div>

          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">

            {recentBills.length === 0 ? (
              <div
                className="
                  p-6 rounded-2xl
                  bg-gray-100 dark:bg-white/5
                  text-center
                "
              >
                <p className="text-gray-500 dark:text-white/50">
                  No recent bills
                </p>
              </div>
            ) : (
              recentBills.map((bill) => (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  key={bill.id}
                  className="
                    p-4 rounded-2xl
                    bg-gray-100 dark:bg-white/5
                    border border-gray-200 dark:border-white/5
                    flex items-center justify-between gap-4
                  "
                >

                  <div className="min-w-0">

                    <p className="font-semibold truncate text-black dark:text-white">
                      {bill.client_name}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-white/50">
                      #{bill.bill_number}
                    </p>

                    <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                      Rs {formatNumber(bill.total_amount)}
                    </p>

                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() =>
                      navigate(`/invoice/${bill.id}`)
                    }
                    className="
                      flex items-center gap-2
                      px-4 py-2 rounded-xl
                      bg-black text-white
                      dark:bg-white dark:text-black
                      font-semibold
                      transition-all duration-300
                      shrink-0
                    "
                  >
                    <FaFileInvoice />
                    Invoice
                  </motion.button>

                </motion.div>
              ))
            )}

          </div>

        </motion.div>

      </div>

    </div>
  );
}
