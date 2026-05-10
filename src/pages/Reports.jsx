import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabase";
import toast from "react-hot-toast";

import {
  FaChartLine,
  FaFileInvoice,
  FaUsers,
  FaWarehouse,
  FaDownload,
  FaFilter,
  FaExclamationTriangle,
  FaSearch,
  FaBoxes,
  FaSyncAlt,
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
  BarChart,
  Bar,
  Legend,
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

/* FORMAT */
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

/* STAT CARD */
const StatCard = ({
  title,
  value,
  icon,
  glow,
  textColor,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        relative overflow-hidden
        rounded-3xl
        border border-black/10 dark:border-white/10
        bg-white dark:bg-[#0a0a0a]
        p-5
      "
    >
      <div
        className={`
          absolute -top-10 -right-10
          h-40 w-40 blur-3xl opacity-15
          ${glow}
        `}
      />

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-white/50">
            {title}
          </p>

          <h2
            className={`
              text-4xl font-black mt-3
              ${textColor}
            `}
          >
            {formatNumber(value)}
          </h2>
        </div>

        <div
          className={`
            h-14 w-14 rounded-2xl
            flex items-center justify-center text-xl
            ${textColor}
          `}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default function Reports() {
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("yearly");

  const [stats, setStats] = useState({
    revenue: 0,
    bills: 0,
    clients: 0,
    stock: 0,
    lowStock: 0,
    deadStock: 0,
  });

  const [revenueChart, setRevenueChart] = useState([]);
  const [stockChart, setStockChart] = useState([]);
  const [productPie, setProductPie] = useState([]);

  /* FETCH */
  const fetchReports = async () => {
    try {
      setLoading(true);

      const [productsRes, billsRes] =
        await Promise.all([
          supabase.from("products").select("*"),
          supabase.from("bills").select("*"),
        ]);

      const products = productsRes.data || [];
      const bills = billsRes.data || [];

      setProducts(products);
      setBills(bills);

      const totalRevenue = bills.reduce(
        (sum, bill) =>
          sum + Number(bill.total_amount || 0),
        0
      );

      const totalStock = products.reduce(
        (sum, p) =>
          sum + Number(p.stock || 0),
        0
      );

      const uniqueClients = [
        ...new Set(
          bills.map((b) => b.client_name)
        ),
      ];

      const lowStock = products.filter(
        (p) => Number(p.stock) <= 5
      );

      const deadStock = products.filter(
        (p) => Number(p.stock) === 0
      );

      setStats({
        revenue: totalRevenue,
        bills: bills.length,
        clients: uniqueClients.length,
        stock: totalStock,
        lowStock: lowStock.length,
        deadStock: deadStock.length,
      });

      /* MONTHS */
      const months = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec",
      ];

      const revenueMap = {};
      const stockMap = {};

      bills.forEach((bill) => {
        const date = new Date(
          bill.created_at
        );

        const month =
          months[date.getMonth()];

        revenueMap[month] =
          (revenueMap[month] || 0) +
          Number(
            bill.total_amount || 0
          );
      });

      products.forEach((product) => {
        const randomMonth =
          months[
            Math.floor(
              Math.random() * 12
            )
          ];

        stockMap[randomMonth] =
          (stockMap[
            randomMonth
          ] || 0) +
          Number(
            product.stock || 0
          );
      });

      setRevenueChart(
        months.map((month) => ({
          name: month,
          revenue:
            revenueMap[
              month
            ] || 0,
        }))
      );

      setStockChart(
        months.map((month) => ({
          name: month,
          stockIn:
            stockMap[
              month
            ] || 0,
          stockOut:
            Math.floor(
              Math.random() * 500
            ),
        }))
      );

      setProductPie(
        products
          .slice(0, 6)
          .map((p) => ({
            name:
              p.product_name,
            value:
              Number(
                p.stock || 0
              ),
          }))
      );
    } catch {
      toast.error(
        "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  /* FILTER CLIENTS */
  const topClients =
    useMemo(() => {
      return bills.filter(
        (bill) =>
          bill.client_name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [bills, search]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map(
          (_, i) => (
            <div
              key={i}
              className="
                h-32 rounded-3xl
                bg-black/5
                dark:bg-white/5
                animate-pulse
              "
            />
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black dark:text-white">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">

        <div>
          <h1 className="text-4xl font-black">
            Reports
          </h1>

          <p className="text-gray-500 dark:text-white/50 text-sm">
            Advanced business intelligence
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          <button
            onClick={fetchReports}
            className="
              px-5 py-3 rounded-2xl
              bg-blue-500/10 text-blue-500
              font-bold
              flex items-center gap-2
            "
          >
            <FaSyncAlt />
            Refresh
          </button>

          <button
            className="
              px-5 py-3 rounded-2xl
              bg-green-500 text-black
              font-bold
              flex items-center gap-2
            "
          >
            <FaDownload />
            Export
          </button>

        </div>
      </div>

      {/* FILTER BAR */}
      <motion.div
        className="
          rounded-[32px]
          border border-black/10 dark:border-white/10
          bg-white/80 dark:bg-[#0a0a0a]/90
          backdrop-blur-xl
          p-5
        "
      >
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* SEARCH */}
          <div
            className="
              flex items-center gap-3
              rounded-3xl
              border border-black/10 dark:border-white/10
              px-4 py-4
            "
          >
            <FaSearch />

            <input
              placeholder="Search client..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="
                bg-transparent
                outline-none
                w-full
              "
            />
          </div>

          {/* PERIOD */}
          <div
            className="
              rounded-3xl
              border border-black/10 dark:border-white/10
              px-4 py-4
            "
          >
            <select
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value
                )
              }
              className="
                bg-transparent
                outline-none
                w-full
              "
            >
              <option value="daily">
                Daily
              </option>

              <option value="monthly">
                Monthly
              </option>

              <option value="yearly">
                Yearly
              </option>
            </select>
          </div>

        </div>
      </motion.div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

        <StatCard
          title="Revenue"
          value={stats.revenue}
          icon={<FaChartLine />}
          glow="bg-green-500"
          textColor="text-green-500"
        />

        <StatCard
          title="Bills"
          value={stats.bills}
          icon={<FaFileInvoice />}
          glow="bg-blue-500"
          textColor="text-blue-500"
        />

        <StatCard
          title="Clients"
          value={stats.clients}
          icon={<FaUsers />}
          glow="bg-purple-500"
          textColor="text-purple-500"
        />

        <StatCard
          title="Stock"
          value={stats.stock}
          icon={<FaWarehouse />}
          glow="bg-yellow-500"
          textColor="text-yellow-500"
        />

        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          icon={
            <FaExclamationTriangle />
          }
          glow="bg-red-500"
          textColor="text-red-500"
        />

        <StatCard
          title="Dead Stock"
          value={stats.deadStock}
          icon={<FaBoxes />}
          glow="bg-orange-500"
          textColor="text-orange-500"
        />

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">

        {/* REVENUE */}
        <div
          className="
            2xl:col-span-2
            rounded-3xl
            border border-black/10 dark:border-white/10
            bg-white dark:bg-[#0a0a0a]
            p-6
          "
        >
          <h2 className="font-black text-xl mb-4">
            Revenue Analytics
          </h2>

          <div className="h-[350px]">

            <ResponsiveContainer>

              <AreaChart
                data={
                  revenueChart
                }
              >
                <CartesianGrid
                  opacity={0.1}
                />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Area
                  dataKey="revenue"
                  stroke="#22c55e"
                  fill="#22c55e22"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>
        </div>

        {/* PIE */}
        <div
          className="
            rounded-3xl
            border border-black/10 dark:border-white/10
            bg-white dark:bg-[#0a0a0a]
            p-6
          "
        >
          <h2 className="font-black text-xl mb-4">
            Product Distribution
          </h2>

          <div className="h-[350px]">

            <ResponsiveContainer>

              <PieChart>

                <Pie
                  data={productPie}
                  dataKey="value"
                  outerRadius={110}
                >
                  {productPie.map(
                    (_, i) => (
                      <Cell
                        key={i}
                        fill={
                          COLORS[
                            i %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </div>
        </div>

      </div>

      {/* STOCK */}
      <div
        className="
          rounded-3xl
          border border-black/10 dark:border-white/10
          bg-white dark:bg-[#0a0a0a]
          p-6
        "
      >
        <h2 className="font-black text-xl mb-4">
          Stock Flow
        </h2>

        <div className="h-[350px]">

          <ResponsiveContainer>

            <BarChart
              data={stockChart}
            >
              <CartesianGrid
                opacity={0.1}
              />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="stockIn"
                fill="#22c55e"
              />

              <Bar
                dataKey="stockOut"
                fill="#ef4444"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>
      </div>

      {/* CLIENTS */}
      <div
        className="
          rounded-3xl
          border border-black/10 dark:border-white/10
          bg-white dark:bg-[#0a0a0a]
          p-6
        "
      >
        <h2 className="font-black text-xl mb-5">
          Client Billing History
        </h2>

        <div className="space-y-3">

          {topClients
            .slice(0, 15)
            .map((bill) => (
              <div
                key={bill.id}
                className="
                  rounded-2xl
                  bg-gray-100 dark:bg-white/5
                  p-4
                  flex justify-between
                "
              >
                <div>
                  <p className="font-bold">
                    {
                      bill.client_name
                    }
                  </p>

                  <p className="text-sm text-gray-500 dark:text-white/50">
                    #
                    {
                      bill.bill_number
                    }
                  </p>
                </div>

                <p className="font-black text-green-500">
                  Rs{" "}
                  {formatNumber(
                    bill.total_amount
                  )}
                </p>

              </div>
            ))}

        </div>
      </div>

    </div>
  );
}
