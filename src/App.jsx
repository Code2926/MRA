import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { supabase } from "./supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Bill from "./pages/Bill";
import Reports from "./pages/Reports";
import Invoice from "./pages/Invoice";

import MainLayout from "./components/MainLayout";

/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= SESSION CHECK ================= */
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  /* ================= LOADING UI ================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Toast */}
      <Toaster position="top-right" />

      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* DASHBOARD */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* INVENTORY */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute user={user}>
              <MainLayout>
                <Inventory />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* BILL */}
        <Route
          path="/bill"
          element={
            <ProtectedRoute user={user}>
              <MainLayout>
                <Bill />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* REPORTS */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute user={user}>
              <MainLayout>
                <Reports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* INVOICE (NO LAYOUT FOR PRINTING) */}
        <Route
          path="/invoice/:id"
          element={
            <ProtectedRoute user={user}>
              <Invoice />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}