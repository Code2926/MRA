import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { useTheme } from "../context/ThemeContext";

import {
  FiHelpCircle,
  FiUser,
  FiX,
  FiSun,
  FiMoon,
  FiInfo,
  FiAlertCircle,
  FiShield,
} from "react-icons/fi";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../supabase";
import toast from "react-hot-toast";

export default function MainLayout({ children }) {
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);

  /* LOGOUT */
  const handleLogout = async () => {
    await supabase.auth.signOut();

    toast.success("Logged out");

    navigate("/login");
  };

  /* CHANGE PASSWORD */
  const handleChangePassword = async () => {
    if (!newPass || !confirm) {
      return toast.error("Fill all fields");
    }

    if (newPass !== confirm) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPass,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated");

      setOpen(false);

      setCurrent("");
      setNewPass("");
      setConfirm("");
    }
  };

  return (
    <div
      className="
        flex min-h-screen
        bg-gray-50 dark:bg-[#050505]
        text-black dark:text-white
        transition-colors duration-300
      "
    >

      {/* SIDEBAR */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* MAIN */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* TOPBAR */}
        <header
          className="
            sticky top-0 z-40
            border-b border-gray-200 dark:border-white/10
            bg-white/80 dark:bg-black/30
            backdrop-blur-2xl
            transition-colors duration-300
          "
        >

          <div className="flex items-center px-4 sm:px-6 md:px-8 py-4">

            {/* MOBILE LOGO */}
            <div className="flex-1 lg:hidden">
              <h1 className="font-black tracking-[0.2em] text-sm sm:text-base">
                MRA INVENTORY
              </h1>
            </div>

            <div className="hidden lg:flex flex-1" />

            {/* ACTIONS */}
            <div className="flex items-center gap-3 ml-auto">

              {/* THEME */}
              <button
                onClick={toggleTheme}
                className="
                  h-10 w-10 rounded-2xl
                  border border-gray-200 dark:border-white/10
                  bg-gray-100 dark:bg-white/5
                  text-black dark:text-white
                  flex items-center justify-center
                  transition-all duration-300
                  hover:scale-105
                  hover:bg-gray-200
                  dark:hover:bg-white/10
                "
              >
                {theme === "dark" ? (
                  <FiSun className="text-yellow-400 text-lg" />
                ) : (
                  <FiMoon className="text-blue-500 text-lg" />
                )}
              </button>

              {/* HELP */}
              <button
                onClick={() => setHelpOpen(true)}
                className="
                  h-10 w-10 rounded-2xl
                  border border-gray-200 dark:border-white/10
                  bg-gray-100 dark:bg-white/5
                  text-black dark:text-white
                  flex items-center justify-center
                  transition-all duration-300
                  hover:scale-105
                  hover:bg-gray-200
                  dark:hover:bg-white/10
                "
              >
                <FiHelpCircle className="text-lg" />
              </button>

              {/* USER */}
              <button
                onClick={() => setOpen(true)}
                className="
                  h-10 w-10 rounded-2xl
                  border border-gray-200 dark:border-white/10
                  bg-gray-100 dark:bg-white/5
                  text-black dark:text-white
                  flex items-center justify-center
                  transition-all duration-300
                  hover:scale-105
                  hover:bg-gray-200
                  dark:hover:bg-white/10
                "
              >
                <FiUser className="text-lg" />
              </button>

            </div>

          </div>
        </header>

        {/* CONTENT */}
        <main
          className="
            flex-1
            p-4 sm:p-6 md:p-8
            pb-24 md:pb-8
            bg-gray-50 dark:bg-[#050505]
            transition-colors duration-300
          "
        >
          {children}
        </main>

        {/* MOBILE NAV */}
        <div className="lg:hidden">
          <BottomNav />
        </div>

      </div>

      {/* USER MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              bg-black/70 backdrop-blur-xl
              p-4
            "
          >

            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="
                w-full max-w-md
                rounded-3xl
                border border-gray-200 dark:border-white/10
                bg-white dark:bg-[#0a0a0a]
                text-black dark:text-white
                overflow-hidden
                shadow-2xl
              "
            >

              {/* HEADER */}
              <div
                className="
                  flex justify-between items-center
                  p-5
                  border-b border-gray-200 dark:border-white/10
                "
              >

                <h2 className="text-lg font-bold">
                  User Settings
                </h2>

                <button
                  onClick={() => setOpen(false)}
                  className="
                    h-10 w-10 rounded-2xl
                    bg-gray-100 dark:bg-white/5
                    flex items-center justify-center
                    hover:scale-105
                    transition-all
                  "
                >
                  <FiX />
                </button>

              </div>

              {/* BODY */}
              <div className="p-5 space-y-4">

                {[current, newPass, confirm].map((val, i) => (
                  <input
                    key={i}
                    type="password"
                    value={val}
                    onChange={(e) => {
                      if (i === 0) setCurrent(e.target.value);
                      if (i === 1) setNewPass(e.target.value);
                      if (i === 2) setConfirm(e.target.value);
                    }}
                    className="
                      w-full px-4 py-3 rounded-2xl
                      bg-gray-100 dark:bg-black/30
                      border border-gray-200 dark:border-white/10
                      outline-none
                      text-black dark:text-white
                      placeholder:text-gray-500
                    "
                    placeholder={
                      i === 0
                        ? "Current Password"
                        : i === 1
                        ? "New Password"
                        : "Confirm Password"
                    }
                  />
                ))}

                {/* UPDATE */}
                <button
                  onClick={handleChangePassword}
                  className="
                    w-full py-3 rounded-2xl
                    font-bold
                    bg-black text-white
                    dark:bg-white dark:text-black
                    hover:scale-[1.02]
                    transition-all duration-300
                  "
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="
                    w-full py-3 rounded-2xl
                    font-bold text-white
                    bg-red-500
                    hover:bg-red-600
                    transition-all duration-300
                  "
                >
                  Logout
                </button>

              </div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* HELP MODAL */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              bg-black/70 backdrop-blur-xl
              p-4
            "
          >

            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="
                w-full max-w-2xl
                rounded-3xl
                border border-gray-200 dark:border-white/10
                bg-white dark:bg-[#0a0a0a]
                text-black dark:text-white
                overflow-hidden
                shadow-2xl
              "
            >

              {/* HEADER */}
              <div
                className="
                  flex items-center justify-between
                  px-6 py-5
                  border-b border-gray-200 dark:border-white/10
                "
              >

                <div>
                  <h2 className="text-2xl font-black">
                    Help Center
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                    Inventory management guidance
                  </p>
                </div>

                <button
                  onClick={() => setHelpOpen(false)}
                  className="
                    h-10 w-10 rounded-2xl
                    bg-gray-100 dark:bg-white/5
                    flex items-center justify-center
                    hover:scale-105
                    transition-all
                  "
                >
                  <FiX />
                </button>

              </div>

              {/* BODY */}
              <div
                className="
                  p-6 space-y-6
                  max-h-[80vh]
                  overflow-y-auto
                "
              >

                {/* HOW TO USE */}
                <div
                  className="
                    rounded-3xl
                    border border-gray-200 dark:border-white/10
                    bg-gray-50 dark:bg-white/[0.03]
                    p-5
                  "
                >

                  <div className="flex items-center gap-3 mb-4">

                    <div
                      className="
                        h-12 w-12 rounded-2xl
                        bg-blue-500/10 text-blue-500
                        flex items-center justify-center
                        text-xl
                      "
                    >
                      <FiInfo />
                    </div>

                    <div>
                      <h3 className="font-bold text-lg">
                        How to Use System
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-white/50">
                        Basic workflow
                      </p>
                    </div>

                  </div>

                  <div className="space-y-3 text-sm sm:text-base">

                    <div className="flex gap-3">
                      <span className="font-black text-blue-500">•</span>

                      <p>
                        Go to <span className="font-bold">Inventory</span> to manage stock
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-black text-blue-500">•</span>

                      <p>
                        Click products to add in bill
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-black text-blue-500">•</span>

                      <p>
                        Enter quantity and price
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-black text-blue-500">•</span>

                      <p>
                        Save bill to generate invoice
                      </p>
                    </div>

                  </div>

                </div>

                {/* TIPS */}
                <div
                  className="
                    rounded-3xl
                    border border-gray-200 dark:border-white/10
                    bg-gray-50 dark:bg-white/[0.03]
                    p-5
                  "
                >

                  <div className="flex items-center gap-3 mb-4">

                    <div
                      className="
                        h-12 w-12 rounded-2xl
                        bg-yellow-500/10 text-yellow-500
                        flex items-center justify-center
                        text-xl
                      "
                    >
                      <FiAlertCircle />
                    </div>

                    <div>
                      <h3 className="font-bold text-lg">
                        Tips
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-white/50">
                        Important reminders
                      </p>
                    </div>

                  </div>

                  <div className="space-y-3 text-sm sm:text-base">

                    <div className="flex gap-3">
                      <span className="font-black text-red-500">•</span>

                      <p>
                        Red items indicate low stock
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-black text-red-500">•</span>

                      <p>
                        Always verify price before saving bill
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-black text-red-500">•</span>

                      <p>
                        Invoice opens automatically after save
                      </p>
                    </div>

                  </div>

                </div>

                {/* SUPPORT */}
                <div
                  className="
                    rounded-3xl
                    border border-gray-200 dark:border-white/10
                    bg-gray-50 dark:bg-white/[0.03]
                    p-5
                  "
                >

                  <div className="flex items-center gap-3 mb-4">

                    <div
                      className="
                        h-12 w-12 rounded-2xl
                        bg-green-500/10 text-green-500
                        flex items-center justify-center
                        text-xl
                      "
                    >
                      <FiShield />
                    </div>

                    <div>
                      <h3 className="font-bold text-lg">
                        Support
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-white/50">
                        Technical assistance
                      </p>
                    </div>

                  </div>

                  <p
                    className="
                      text-sm sm:text-base
                      text-gray-600 dark:text-white/70
                      leading-relaxed
                    "
                  >
                    Contact system administrator if you face any issue
                    related to inventory, billing, invoices, stock
                    management, or data problems.
                  </p>

                </div>

              </div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}