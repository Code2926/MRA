import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";

const Invoice = () => {
  const { id } = useParams();

  const [bill, setBill] = useState(null);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = async () => {
    try {
      // FETCH BILL
      const { data: billData, error: billError } = await supabase
        .from("bills")
        .select("*")
        .eq("id", id)
        .single();

      if (billError) throw billError;

      // FETCH ITEMS
      const { data: itemsData, error: itemsError } = await supabase
        .from("bill_items")
        .select("*")
        .eq("bill_id", id);

      if (itemsError) throw itemsError;

      // FETCH SETTINGS (🔥 NEW)
      const { data: settingsData, error: settingsError } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (settingsError) throw settingsError;

      setSettings(settingsData);

      if (!itemsData || itemsData.length === 0) {
        setBill(billData);
        setItems([]);
        setLoading(false);
        return;
      }

      // FETCH PRODUCTS
      const productIds = itemsData.map((i) => i.product_id);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, product_name, bike_type, quality")
        .in("id", productIds);

      if (productsError) throw productsError;

      // MERGE
      const mergedItems = itemsData.map((item) => {
        const product = productsData?.find(
          (p) => p.id === item.product_id
        );

        return {
          ...item,
          product_name: product?.product_name || "Unknown",
          bike_type: product?.bike_type || "",
          quality: product?.quality || "",
        };
      });

      setBill(billData);
      setItems(mergedItems);

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchInvoice();
  }, []);

  useEffect(() => {
    if (!loading && bill) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [loading, bill]);

  if (loading) return <p style={{ padding: 20 }}>Loading invoice...</p>;
  if (!bill) return <p style={{ padding: 20 }}>Invoice not found</p>;

  return (
    <div style={{ padding: 30, fontFamily: "Arial", maxWidth: 900, margin: "auto" }}>

      {/* HEADER (🔥 NOW DYNAMIC) */}
      <div style={{ textAlign: "center" }}>
        <h1>{settings?.company_name}</h1>
        <p>{settings?.address}</p>
        <p>{settings?.phone}</p>
      </div>

      <hr />

      {/* INFO */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p><strong>Client:</strong> {bill.client_name}</p>
          <p><strong>Bill No:</strong> {bill.bill_number}</p>
        </div>

        <div>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* TABLE */}
      <table
        style={{
          width: "100%",
          marginTop: 20,
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Product</th>
            <th style={thStyle}>Bike</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Qty</th>
            <th style={thStyle}>Price</th>
            <th style={thStyle}>Total</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.product_name}</td>
              <td style={tdStyle}>{item.bike_type}</td>
              <td style={tdStyle}>{item.quality}</td>
              <td style={tdStyle}>{item.quantity}</td>
              <td style={tdStyle}>Rs {item.price}</td>
              <td style={tdStyle}>Rs {item.quantity * item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL */}
      <h2 style={{ textAlign: "right", marginTop: 20 }}>
        Total: Rs {bill.total_amount}
      </h2>

      {/* FOOTER */}
      <p style={{ textAlign: "center", marginTop: 30 }}>
        Thank you for your business
      </p>

      {/* PRINT STYLE */}
      <style>
        {`
          @media print {
            body {
              margin: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

// STYLES
const thStyle = {
  border: "1px solid black",
  padding: "8px",
  background: "#000",
  color: "#fff",
};

const tdStyle = {
  border: "1px solid black",
  padding: "8px",
  textAlign: "center",
};

export default Invoice;