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
  const bikeTypes = [
    ...new Set(products.map((p) => p.bike_type).filter(Boolean)),
  ];

  const qualities = [
    ...new Set(products.map((p) => p.quality).filter(Boolean)),
  ];

  const models = [
    ...new Set(products.map((p) => p.model).filter(Boolean)),
  ];

  /* FILTER PRODUCTS */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = `${p.product_name} ${p.bike_type} ${
        p.quality
      } ${p.model || ""}`
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

      window.open(`/invoice/${billData.id}`, "_blank");

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
    <div className="space-y-6 text-black dark:text-white">
      <div>
        <h1 className="text-4xl font-black">Billing</h1>
        <p className="text-gray-500 dark:text-white/50 text-sm mt-1">
          Create invoices and manage customer billing
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -5 }}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Products
              </p>
              <h2 className="text-4xl font-black mt-2">
                {formatNumber(products.length)}
              </h2>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/10">
              <FaBox />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Cart Items
              </p>
              <h2 className="text-4xl font-black mt-2">
                {formatNumber(cart.length)}
              </h2>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-500 flex items-center justify-center text-xl shadow-lg shadow-green-500/10">
              <FaShoppingCart />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Total Amount
              </p>
              <h2 className="text-4xl font-black mt-2 break-words">
                Rs {formatNumber(total)}
              </h2>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-500 flex items-center justify-center text-xl shadow-lg shadow-yellow-500/10">
              <FaFileInvoice />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
