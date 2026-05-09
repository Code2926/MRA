import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabase";
import toast from "react-hot-toast";

import {
  FaBox,
  FaWarehouse,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaSearch,
} from "react-icons/fa";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({});
  const [search, setSearch] = useState("");

  /* FETCH PRODUCTS */
  const fetchItems = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("id, product_name, bike_type, quality, model, stock")
      .order("bike_type", { ascending: true });

    if (error) {
      toast.error("Failed to load inventory");
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  /* UPDATE STOCK */
  const updateStock = async (id, newStock) => {
    if (newStock < 0) return;

    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", id);

    if (error) {
      toast.error("Stock update failed");
    } else {
      fetchItems();
    }
  };

  /* ADD STOCK */
  const addStock = async (item) => {
    const value = parseInt(inputs[item.id] || 0);

    if (!value || value <= 0) {
      return toast.error("Enter valid quantity");
    }

    await updateStock(item.id, item.stock + value);

    toast.success("Stock Added");

    setInputs({
      ...inputs,
      [item.id]: "",
    });
  };

  /* DEDUCT STOCK */
  const deductStock = async (item) => {
    const value = parseInt(inputs[item.id] || 0);

    if (!value || value <= 0) {
      return toast.error("Enter valid quantity");
    }

    if (item.stock - value < 0) {
      return toast.error("Not enough stock");
    }

    await updateStock(item.id, item.stock - value);

    toast.success("Stock Deducted");

    setInputs({
      ...inputs,
      [item.id]: "",
    });
  };

  /* TOTALS */
  const totalStock = items.reduce(
    (sum, item) => sum + Number(item.stock || 0),
    0
  );

  const lowStockItems = items.filter((item) => item.stock <= 5);

  /* SEARCH */
  const filteredItems = items.filter((item) =>
    `
      ${item.product_name}
      ${item.bike_type}
      ${item.quality}
      ${item.model}
    `
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* FORMAT */
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }

    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }

    return num;
  };

  return (
    <div className="space-y-6 text-black dark:text-white">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-4xl font-black">
            Inventory
          </h1>

          <p className="text-gray-500 dark:text-white/50 text-sm mt-1">
            Manage products, stock, models & quality
          </p>
        </div>

        {/* SEARCH */}
        <div
          className="
            flex items-center gap-3
            px-4 py-3
            rounded-2xl
            border border-black/10 dark:border-white/10
            bg-white dark:bg-[#0a0a0a]
            w-full lg:w-[320px]
          "
        >
          <FaSearch className="text-gray-400" />

          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              bg-transparent outline-none
              w-full
              text-sm
              placeholder:text-gray-400
            "
          />
        </div>

      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* PRODUCTS */}
        <motion.div
          whileHover={{ y: -5 }}
          className="
            rounded-3xl
            border border-black/10 dark:border-white/10
            bg-white dark:bg-[#0a0a0a]
            p-5
            relative overflow-hidden
          "
        >

          <div className="absolute -top-10 -right-10 h-40 w-40 bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex justify-between">

            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Total Products
              </p>

              <h2 className="text-4xl font-black mt-3 break-words">
                {formatNumber(items.length)}
              </h2>
            </div>

            <div
              className="
                h-14 w-14 rounded-2xl
                bg-blue-500/10
                text-blue-500
                flex items-center justify-center
                text-xl
              "
            >
              <FaBox />
            </div>

          </div>

        </motion.div>

        {/* STOCK */}
        <motion.div
          whileHover={{ y: -5 }}
          className="
            rounded-3xl
            border border-black/10 dark:border-white/10
            bg-white dark:bg-[#0a0a0a]
            p-5
            relative overflow-hidden
          "
        >

          <div className="absolute -top-10 -right-10 h-40 w-40 bg-green-500/10 blur-3xl" />

          <div className="relative z-10 flex justify-between">

            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Total Stock
              </p>

              <h2 className="text-4xl font-black mt-3 break-words">
                {formatNumber(totalStock)}
              </h2>
            </div>

            <div
              className="
                h-14 w-14 rounded-2xl
                bg-green-500/10
                text-green-500
                flex items-center justify-center
                text-xl
              "
            >
              <FaWarehouse />
            </div>

          </div>

        </motion.div>

        {/* LOW STOCK */}
        <motion.div
          whileHover={{ y: -5 }}
          className="
            rounded-3xl
            border border-red-500/20
            bg-white dark:bg-[#0a0a0a]
            p-5
            relative overflow-hidden
          "
        >

          <div className="absolute -top-10 -right-10 h-40 w-40 bg-red-500/10 blur-3xl" />

          <div className="relative z-10 flex justify-between">

            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Low Stock
              </p>

              <h2 className="text-4xl font-black mt-3 break-words text-red-500">
                {formatNumber(lowStockItems.length)}
              </h2>
            </div>

            <div
              className="
                h-14 w-14 rounded-2xl
                bg-red-500/10
                text-red-500
                flex items-center justify-center
                text-xl
              "
            >
              <FaExclamationTriangle />
            </div>

          </div>

        </motion.div>

      </div>

      {/* ITEMS */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="
                h-[320px]
                rounded-3xl
                bg-black/5 dark:bg-white/5
                animate-pulse
              "
            />
          ))}

        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

          {filteredItems.map((item) => {
            const lowStock = item.stock <= 5;

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -5 }}
                className={`
                  relative overflow-hidden
                  rounded-3xl
                  border
                  p-5
                  transition-all duration-300

                  ${
                    lowStock
                      ? "border-red-500/20 bg-red-500/[0.04]"
                      : "border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a]"
                  }
                `}
              >

                {/* GLOW */}
                <div
                  className={`
                    absolute -top-10 -right-10
                    h-40 w-40 blur-3xl opacity-20

                    ${
                      lowStock
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }
                  `}
                />

                <div className="relative z-10">

                  {/* TOP */}
                  <div className="flex justify-between items-start gap-3">

                    <div className="min-w-0">

                      <h2
                        className="
                          text-xl font-black
                          leading-tight
                          break-words
                        "
                      >
                        {item.product_name}
                      </h2>

                      <div className="flex flex-wrap gap-2 mt-3">

                        <span
                          className="
                            px-3 py-1 rounded-full
                            text-xs font-bold
                            bg-blue-500/10 text-blue-500
                          "
                        >
                          {item.bike_type}
                        </span>

                        <span
                          className="
                            px-3 py-1 rounded-full
                            text-xs font-bold
                            bg-yellow-500/10 text-yellow-500
                          "
                        >
                          {item.quality}
                        </span>

                        <span
                          className="
                            px-3 py-1 rounded-full
                            text-xs font-bold
                            bg-green-500/10 text-green-500
                          "
                        >
                          {item.model || "NEW"}
                        </span>

                      </div>

                    </div>

                    <div
                      className={`
                        px-4 py-2 rounded-2xl
                        font-black text-xl

                        ${
                          lowStock
                            ? "bg-red-500/10 text-red-500"
                            : "bg-green-500/10 text-green-500"
                        }
                      `}
                    >
                      {formatNumber(item.stock)}
                    </div>

                  </div>

                  {/* INPUT */}
                  <div className="mt-6">

                    <input
                      type="number"
                      placeholder="Enter quantity"
                      value={inputs[item.id] || ""}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          [item.id]: e.target.value,
                        })
                      }
                      className="
                        w-full
                        rounded-2xl
                        px-4 py-3
                        outline-none
                        border border-black/10 dark:border-white/10
                        bg-gray-100 dark:bg-black/30
                        text-black dark:text-white
                        placeholder:text-gray-400
                      "
                    />

                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-3 mt-5">

                    <button
                      onClick={() => addStock(item)}
                      className="
                        flex-1
                        py-3 rounded-2xl
                        bg-green-500
                        hover:bg-green-600
                        text-black
                        font-black
                        transition-all duration-300
                        flex items-center justify-center gap-2
                      "
                    >
                      <FaArrowUp />
                      Add
                    </button>

                    <button
                      onClick={() => deductStock(item)}
                      className="
                        flex-1
                        py-3 rounded-2xl
                        bg-red-500
                        hover:bg-red-600
                        text-black
                        font-black
                        transition-all duration-300
                        flex items-center justify-center gap-2
                      "
                    >
                      <FaArrowDown />
                      Deduct
                    </button>

                  </div>

                </div>

              </motion.div>
            );
          })}

        </div>
      )}
    </div>
  );
}