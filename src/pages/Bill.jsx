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
} from "react-icons/fa";

export default function Bill() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState("");

  /* FETCH PRODUCTS */
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("product_name", { ascending: true });

    if (error) {
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

    if (!error) setSettings(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, []);

  /* FORMAT */
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  /* FILTER */
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      `
        ${p.product_name}
        ${p.bike_type}
        ${p.quality}
        ${p.model}
      `
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [products, search]);

  /* CART FUNCTIONS */
  const addToCart = (product) => {
    const exists = cart.find((item) => item.id === product.id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1, price: "" }]);
    }

    toast.success(`${product.product_name} added`);
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) return;
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const updatePrice = (id, price) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, price } : item
      )
    );
  };

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.success("Item removed");
  };

  const total = cart.reduce((sum, item) => {
    return sum + item.quantity * (parseFloat(item.price) || 0);
  }, 0);

  const validate = () => {
    if (!clientName) return toast.error("Enter client name"), false;
    if (!cart.length) return toast.error("Cart empty"), false;
    return true;
  };

  const saveBill = async () => {
    if (!validate()) return;
    setLoading(true);

    const prefix = settings?.invoice_prefix || "BILL";

    try {
      const { data: billData, error } = await supabase
        .from("bills")
        .insert([
          {
            bill_number: `${prefix}-${Date.now()}`,
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

      await supabase.from("bill_items").insert(items);

      for (let item of cart) {
        await supabase
          .from("products")
          .update({ stock: item.stock - item.quantity })
          .eq("id", item.id);
      }

      toast.success("Bill saved");
      setCart([]);
      setClientName("");
      fetchProducts();
    } catch (err) {
      toast.error("Error saving bill");
    }

    setLoading(false);
  };

  const totalStock = products.reduce(
    (sum, p) => sum + Number(p.stock || 0),
    0
  );

  const lowStock = products.filter((p) => p.stock <= 5);

  /* UI */
  return (
    <div className="space-y-6 text-black dark:text-white">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">Billing</h1>
          <p className="text-gray-500 dark:text-white/50 text-sm mt-1">
            Create invoices and manage customer billing
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white dark:bg-[#0a0a0a] w-full lg:w-[320px]">
          <FaSearch className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border p-5 bg-white dark:bg-[#0a0a0a]">
          <FaBox className="text-blue-500 text-2xl float-right" />
          <p>Total Products</p>
          <h2 className="text-3xl font-black">{products.length}</h2>
        </div>

        <div className="rounded-3xl border p-5 bg-white dark:bg-[#0a0a0a]">
          <FaShoppingCart className="text-green-500 text-2xl float-right" />
          <p>Cart Items</p>
          <h2 className="text-3xl font-black">{cart.length}</h2>
        </div>

        <div className="rounded-3xl border p-5 bg-white dark:bg-[#0a0a0a]">
          <FaFileInvoice className="text-yellow-500 text-2xl float-right" />
          <p>Total</p>
          <h2 className="text-3xl font-black">Rs {total}</h2>
        </div>
      </div>

      {/* 🔥 STACKED LAYOUT (FIXED) */}
      <div className="flex flex-col gap-6">

        {/* PRODUCTS */}
        <div className="rounded-3xl border p-5 bg-white dark:bg-[#0a0a0a]">

          <h2 className="text-2xl font-black mb-4">Products</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {filteredProducts.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -4 }}
                onClick={() => addToCart(p)}
                className="cursor-pointer rounded-2xl p-4 border bg-gray-50 dark:bg-white/5"
              >
                <h3 className="font-bold">{p.product_name}</h3>
                <p className="text-sm text-gray-500">Stock: {p.stock}</p>
              </motion.div>
            ))}

          </div>
        </div>

        {/* BILL */}
        <div className="rounded-3xl border p-5 bg-white dark:bg-[#0a0a0a]">

          <h2 className="text-2xl font-black mb-4">Create Bill</h2>

          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Name"
            className="w-full p-3 rounded-xl border mb-4 bg-gray-100 dark:bg-black/20"
          />

          {cart.map((item) => (
            <div key={item.id} className="border p-3 rounded-xl mb-3">
              <h3 className="font-bold">{item.product_name}</h3>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  value={item.quantity}
                  onChange={(e) => updateQty(item.id, e.target.value)}
                  className="p-2 border rounded"
                  placeholder="Qty"
                />
                <input
                  value={item.price}
                  onChange={(e) => updatePrice(item.id, e.target.value)}
                  className="p-2 border rounded"
                  placeholder="Price"
                />
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 mt-2"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            onClick={saveBill}
            className="w-full bg-green-500 py-3 rounded-xl font-bold mt-4"
          >
            Save Bill
          </button>

        </div>

      </div>

    </div>
  );
}
