import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabase";
import toast from "react-hot-toast";

import {
  FaShoppingCart,
  FaUser,
  FaBox,
  FaTrash,
  FaPrint,
  FaSearch,
  FaExclamationTriangle,
  FaFileInvoice,
  FaFilter,
} from "react-icons/fa";

export default function Bill() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  /* SEARCH + FILTERS */
  const [search, setSearch] = useState("");
  const [bikeFilter, setBikeFilter] = useState("");
  const [qualityFilter, setQualityFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");

  /* FETCH PRODUCTS */
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("product_name", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
  };

  /* FETCH SETTINGS */
  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (!error) {
      setSettings(data);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, []);

  /* FORMAT NUMBERS */
  const formatNumber = (num) => {
    const value = Number(num) || 0;

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }

    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return value;
  };

  /* UNIQUE FILTER OPTIONS */
  const bikeTypes = [...new Set(products.map((p) => p.bike_type).filter(Boolean))];
  const qualities = [...new Set(products.map((p) => p.quality).filter(Boolean))];
  const models = [...new Set(products.map((p) => p.model).filter(Boolean))];

  /* FILTER PRODUCTS */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = `${p.product_name} ${p.bike_type} ${p.quality} ${
        p.model || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesBike = bikeFilter
        ? p.bike_type === bikeFilter
        : true;

      const matchesQuality = qualityFilter
        ? p.quality === qualityFilter
        : true;

      const matchesModel = modelFilter
        ? p.model === modelFilter
        : true;

      return (
        matchesSearch &&
        matchesBike &&
        matchesQuality &&
        matchesModel
      );
    });
  }, [
    products,
    search,
    bikeFilter,
    qualityFilter,
    modelFilter,
  ]);

  /* ADD TO CART */
  const addToCart = (product) => {
    const exists = cart.find((item) => item.id === product.id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          price: "",
        },
      ]);
    }

    toast.success(`${product.product_name} added`);
  };

  /* UPDATE QTY */
  const updateQty = (id, qty) => {
    if (qty <= 0 || isNaN(qty)) return;

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: qty,
            }
          : item
      )
    );
  };

  /* UPDATE PRICE */
  const updatePrice = (id, price) => {
    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              price,
            }
          : item
      )
    );
  };

  /* REMOVE ITEM */
  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.success("Item removed");
  };

  /* TOTAL */
  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    return sum + item.quantity * price;
  }, 0);

  /* VALIDATION */
  const validate = () => {
    if (!clientName.trim()) {
      toast.error("Enter client name");
      return false;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return false;
    }

    for (let item of cart) {
      if (item.quantity > item.stock) {
        toast.error(`Not enough stock for ${item.product_name}`);
        return false;
      }

      if (!item.price || parseFloat(item.price) <= 0) {
        toast.error(`Enter price for ${item.product_name}`);
        return false;
      }
    }

    return true;
  };

  const hasStockIssue = cart.some(
    (item) => item.quantity > item.stock
  );

  /* SAVE BILL */
  const saveBill = async () => {
    if (!validate()) return;

    setLoading(true);

    const prefix = settings?.invoice_prefix || "BILL";
    const generatedBill = `${prefix}-${Date.now()}`;

    try {
      /* CREATE BILL */
      const { data: billData, error } = await supabase
        .from("bills")
        .insert([
          {
            bill_number: generatedBill,
            client_name: clientName,
            total_amount: total,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      /* BILL ITEMS */
      const items = cart.map((item) => ({
        bill_id: billData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price),
      }));

      const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(items);

      if (itemsError) throw itemsError;

      /* UPDATE STOCK */
      for (let item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock: item.stock - item.quantity,
          })
          .eq("id", item.id);

        if (stockError) throw stockError;
      }

      toast.success("Bill saved successfully");

      /* OPEN INVOICE */
      window.open(`/invoice/${billData.id}`, "_blank");

      /* RESET */
      setCart([]);
      setClientName("");

      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8 text-black dark:text-white min-h-screen">
      {/* HEADER */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div>
            <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-black via-gray-900 to-black bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-white leading-tight">
              Billing
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 max-w-lg leading-relaxed">
              Create professional invoices and manage customer billing with precision
            </p>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-5 rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-3 group"
            >
              <FaFileInvoice className="text-xl group-hover:rotate-12 transition-transform duration-300" />
              New Invoice
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-5 rounded-3xl border-2 border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.08] backdrop-blur-xl text-black dark:text-white font-black text-lg shadow-xl hover:shadow-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 flex items-center gap-3"
            >
              <FaPrint className="text-xl" />
              Print Last
            </motion.button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        {/* PRODUCTS */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="group relative rounded-3xl border border-black/5 dark:border-white/5 bg-gradient-to-br from-white/60 via-white to-white/40 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900/40 backdrop-blur-xl p-8 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 dark:shadow-white/5 hover:shadow-white/10 border-opacity-60 hover:border-black/20 dark:hover:border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-cyan-400/0 -skew-x-12 transform -translate-x-40 group-hover:translate-x-40 transition-transform duration-1000 delay-200" />
          
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-600/20 backdrop-blur-xl border-4 border-white/50 shadow-2xl shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-110 transition-all duration-500 flex items-center justify-center z-10">
            <FaBox className="text-3xl text-blue-500 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
          </div>

          <div className="relative z-20">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
              Total Products
            </p>
            
            <h2 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-900 via-black to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:via-white dark:to-gray-100 drop-shadow-lg mb-3">
              {formatNumber(products.length)}
            </h2>
            
            <div className="h-2 w-20 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full shadow-inner" />
          </div>
        </motion.div>

        {/* CART */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="group relative rounded-3xl border border-black/5 dark:border-white/5 bg-gradient-to-br from-white/60 via-white to-white/40 dark:from-emerald-900/60 dark:via-emerald-900 dark:to-emerald-900/40 backdrop-blur-xl p-8 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 dark:shadow-white/5 hover:shadow-white/10 border-opacity-60 hover:border-black/20 dark:hover:border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-green-400/0 -skew-x-12 transform -translate-x-40 group-hover:translate-x-40 transition-transform duration-1000 delay-200" />
          
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-600/20 backdrop-blur-xl border-4 border-white/50 shadow-2xl shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-110 transition-all duration-500 flex items-center justify-center z-10">
            <FaShoppingCart className="text-3xl text-emerald-500 drop-shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
          </div>

          <div className="relative z-20">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
              Cart Items
            </p>
            
            <h2 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 bg-clip-text text-transparent dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500 drop-shadow-lg mb-3">
              {formatNumber(cart.length)}
            </h2>
            
            <div className="h-2 w-20 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-full shadow-inner" />
          </div>
        </motion.div>

        {/* TOTAL */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="group relative rounded-3xl border border-black/5 dark:border-white/5 bg-gradient-to-br from-amber-50/80 via-yellow-50/80 to-orange-50/80 dark:from-amber-900/60 dark:via-orange-900/60 dark:to-amber-900/60 backdrop-blur-xl p-8 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 dark:shadow-white/5 hover:shadow-white/10 border-opacity-60 hover:border-black/20 dark:hover:border-white/20 overflow-hidden md:col-span-2 xl:col-span-1"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/30 to-orange-400/0 -skew-x-12 transform -translate-x-40 group-hover:translate-x-40 transition-transform duration-1000 delay-200" />
          
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-600/20 backdrop-blur-xl border-4 border-white/50 shadow-2xl shadow-amber-500/25 group-hover:shadow-amber-500/40 group-hover:scale-110 transition-all duration-500 flex items-center justify-center z-10">
            <FaFileInvoice className="text-3xl text-amber-500 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
          </div>

          <div className="relative z-20">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
              Total Amount
            </p>
            
            <h2 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-orange-400 dark:to-yellow-400 drop-shadow-2xl mb-3 leading-tight">
              Rs {formatNumber(total)}
            </h2>
            
            <div className="h-3 w-24 bg-gradient-to-r from-amber-500/40 via-orange-500/40 to-yellow-500/40 rounded-full shadow-inner mt-1" />
          </div>
        </motion.div>
      </div>

      {/* PREMIUM SEARCH + FILTER BAR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="group relative overflow-hidden rounded-3xl border-2 border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl shadow-2xl shadow-black/10 dark:shadow-white/10 hover:shadow-3xl hover:shadow-black/20 dark:hover:shadow-white/20 hover:border-black/20 dark:hover:border-white/20 transition-all duration-500 p-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent blur-xl" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-xl border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-110 transition-all duration-400 flex items-center justify-center group-hover/main:scale-110">
              <FaFilter className="text-2xl text-blue-500 drop-shadow-lg" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-3xl scale-0 group-hover/main:scale-100 transition-transform duration-300 origin-center" />
            </div>
            
            <div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent tracking-tight">
                Smart Search & Filters
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-1 font-medium">
                Find exact products instantly with AI-powered filtering
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSearch("");
              setBikeFilter("");
              setQualityFilter("");
              setModelFilter("");
            }}
            className="px-8 py-4 rounded-3xl bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 text-red-600 dark:text-red-400 font-black text-lg shadow-xl shadow-red-500/10 hover:shadow-red-500/20 border border-red-500/20 hover:border-red-500/30 backdrop-blur-xl transition-all duration-300 flex items-center gap-3 group/clear"
          >
            <FaTrash className="text-xl group-hover/clear:-rotate-12 transition-transform duration-300" />
            Clear All Filters
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
          <motion.div
            whileHover={{ x: 4 }}
            className="group/search relative rounded-3xl border-2 border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl p-6 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-400 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover/search:opacity-100 transition-opacity duration-400" />
            <div className="h-12 w-12 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-500 flex items-center justify-center text-xl shadow-xl shadow-blue-500/20 group-hover/search:scale-110 transition-all duration-400 absolute z-10">
              <FaSearch />
            </div>
            
            <div className="flex-1 ml-16">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Search Products
              </p>
              <input
                type="text"
                placeholder="Type product name, code or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-lg font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:placeholder:text-gray-500 transition-colors"
              />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ x: 4 }}
            className="group relative rounded-3xl border-2 border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl p-6 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-400 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 relative z-10">
              Bike Type
            </p>
            <select
              value={bikeFilter}
              onChange={(e) => setBikeFilter(e.target.value)}
              className="bg-transparent outline-none w-full text-lg font-semibold text-gray-900 dark:text-white relative z-10"
            >
              <option value="">All Bike Types</option>
              {bikeTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            whileHover={{ x: 4 }}
            className="group relative rounded-3xl border-2 border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl p-6 hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-400 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 relative z-10">
              Quality Grade
            </p>
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="bg-transparent outline-none w-full text-lg font-semibold text-gray-900 dark:text-white relative z-10"
            >
              <option value="">All Qualities</option>
              {qualities.map((quality, index) => (
                <option key={index} value={quality}>
                  {quality}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            whileHover={{ x: 4 }}
            className="group relative rounded-3xl border-2 border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl p-6 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-400 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 relative z-10">
              Model Number
            </p>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="bg-transparent outline-none w-full text-lg font-semibold text-gray-900 dark:text-white relative z-10"
            >
              <option value="">All Models</option>
              {models.map((model, index) => (
                <option key={index} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </motion.div>
        </div>
      </motion.div>

      {/* PRODUCTS SECTION */}
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl shadow-black/5">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            Available Products
          </h2>

          <motion.span 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-4 py-2 rounded-2xl bg-blue-500/10 text-blue-500 text-sm font-black backdrop-blur-xl border border-blue-500/20"
          >
            {filteredProducts.length} Items
          </motion.span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const lowStock = p.stock <= 5;

            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
                onClick={() => addToCart(p)}
                className={`group cursor-pointer rounded-3xl p-8 border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/10 overflow-hidden ${
                  lowStock
                    ? "border-red-500/30 bg-gradient-to-br from-red-500/5 to-rose-500/5"
                    : "border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] hover:border-blue-500/30"
                }`}
              >
                {lowStock && (
                  <div className="absolute top-4 right-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/30 flex items-center justify-center shadow-xl shadow-red-500/20">
                    <FaExclamationTriangle className="text-xl text-red-500" />
                  </div>
                )}
                
                <div className="flex justify-between items-start gap-6 relative z-10">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-2xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent break-words group-hover:scale-[1.02] transition-transform">
                      {p.product_name}
                    </h3>

                    <div className="flex flex-wrap gap-2 mt-6">
                      <span className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-500 border border-blue-500/20 backdrop-blur-sm">
                        {p.bike_type}
                      </span>

                      <span className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 border border-yellow-500/20 backdrop-blur-sm">
                        {p.quality}
                      </span>

                      <span className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 border border-emerald-500/20 backdrop-blur-sm">
                        {p.model || "NEW"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center pt-6 border-t border-black/10 dark:border-white/10 relative z-10">
                  <span className="text-lg text-gray-600 dark:text-gray-300 font-semibold">
                    Available Stock
                  </span>

                  <span
                    className={`text-3xl font-black px-4 py-2 rounded-2xl ${
                      lowStock 
                        ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-500 border-2 border-red-500/30 shadow-lg shadow-red-500/20" 
                        : "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-500 border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/20"
                    }`}
                  >
                    {formatNumber(p.stock)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CREATE BILL SECTION */}
      <div className="rounded-3xl border-2 border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl shadow-black/5 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            Create Bill
          </h2>

          <motion.span 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 text-sm font-black border border-emerald-500/20 backdrop-blur-xl"
          >
            {cart.length} Items Added
          </motion.span>
        </div>

        {/* CLIENT */}
        <div className="flex items-center gap-4 px-6 py-5 rounded-3xl border-2 border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl mb-8 group hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-400">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-500 flex items-center justify-center text-xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-all duration-300">
            <FaUser />
          </div>

          <input
            placeholder="Enter client name..."
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="bg-transparent outline-none w-full text-xl font-semibold placeholder:text-gray-400 focus:placeholder:text-gray-500 transition-colors"
          />
        </div>

        {/* CART */}
        <div className="space-y-6 mb-8">
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border-2 border-dashed border-black/20 dark:border-white/20 bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl p-16 text-center"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-200/50 to-gray-300/50 dark:from-gray-800/50 dark:to-gray-700/50 flex items-center justify-center mb-6 shadow-xl"
              >
                <FaShoppingCart className="text-4xl text-gray-400" />
              </motion.div>

              <h3 className="font-black text-2xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                Cart is Empty
              </h3>

              <p className="text-lg text-gray-500 dark:text-gray-400">
                Click any product above to add items to your cart
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">
              {cart.map((item) => {
                const isOut = item.quantity > item.stock;

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={`relative rounded-3xl p-8 border-2 transition-all duration-500 group ${
                      isOut
                        ? "border-red-500/40 bg-gradient-to-br from-red-500/5 to-rose-500/5 shadow-lg shadow-red-500/10"
                        : "border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10"
                    }`}
                  >
                    {isOut && (
                      <div className="absolute top-4 right-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/30 flex items-center justify-center shadow-xl shadow-red-500/20">
                        <FaExclamationTriangle className="text-xl text-red-500" />
                      </div>
                    )}

                    <div className="flex justify-between gap-4 mb-6 relative z-10">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent break-words">
                          {item.product_name}
                        </h3>

                        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-semibold">
                          Stock: <span className="text-emerald-500">{formatNumber(item.stock)}</span>
                        </p>

                        {isOut && (
                          <p className="text-red-500 text-sm font-semibold mt-1 bg-red-500/10 px-3 py-1 rounded-xl inline-flex items-center gap-2">
                            <FaExclamationTriangle className="text-xs" />
                            Insufficient stock
                          </p>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeItem(item.id)}
                        className="h-14 w-14 rounded-3xl bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-500 border-2 border-red-500/30 flex items-center justify-center shadow-xl shadow-red-500/20 hover:shadow-red-500/30 hover:scale-110 transition-all duration-300 flex-shrink-0"
                      >
                        <FaTrash />
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                      <div>
                        <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 block">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQty(item.id, parseInt(e.target.value) || 0)
                          }
                          placeholder="Qty"
                          min="1"
                          className="w-full rounded-2xl px-5 py-4 border-2 border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl outline-none text-lg font-semibold text-center focus:border-emerald-500/50 focus:shadow-md focus:shadow-emerald-500/20 transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 block">Unit Price</label>
                        <input
                          type="number"
                          placeholder="Rs 0"
                          value={item.price}
                          onChange={(e) =>
                            updatePrice(item.id, e.target.value)
                          }
                          min="0"
                          step="0.01"
                          className="w-full rounded-2xl px-5 py-4 border-2 border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl outline-none text-lg font-semibold text-right focus:border-emerald-500/50 focus:shadow-md focus:shadow-emerald-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t-2 border-black/10 dark:border-white/10 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                          Subtotal
                        </span>

                        <span className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">
                          Rs {formatNumber(
                            item.quantity * (parseFloat(item.price) || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOTAL & SAVE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border-2 border-black/10 dark:border-white/10 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/60 dark:to-green-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-emerald-500/10"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Grand Total
              </p>

              <h2 className="text-6xl font-black mt-2 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 bg-clip-text text-transparent dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500 drop-shadow-2xl leading-tight">
                Rs {formatNumber(total)}
              </h2>
            </div>

            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 text-emerald-500 flex items-center justify-center text-3xl shadow-2xl shadow-emerald-500/25">
              <FaPrint />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: hasStockIssue ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveBill}
            disabled={loading || hasStockIssue}
            className={`w-full py-6 rounded-3xl font-black text-xl shadow-2xl transition-all duration-500 flex items-center justify-center gap-3 ${
              hasStockIssue
                ? "bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white/90 cursor-not-allowed shadow-red-500/30 hover:shadow-red-500/20"
                : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-emerald-500/40 hover:shadow-emerald-500/50 hover:shadow-2xl"
            }`}
          >
            {loading ? (
              <>
                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving Bill...
              </>
            ) : hasStockIssue ? (
              <>
                <FaExclamationTriangle />
                Fix Stock Issues
              </>
            ) : (
              <>
                <FaFileInvoice />
                Save & Print Invoice
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
