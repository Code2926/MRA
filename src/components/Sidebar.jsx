import { Link, useLocation } from "react-router-dom";
import { FaChartPie, FaClipboardList, FaFileInvoice, FaChartBar } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: <FaChartPie /> },
    { name: "Inventory", path: "/inventory", icon: <FaClipboardList /> },
    { name: "Bill", path: "/bill", icon: <FaFileInvoice /> },
    { name: "Reports", path: "/reports", icon: <FaChartBar /> },
  ];

  return (
    <aside className="
      h-full w-full flex flex-col
      bg-white dark:bg-[#050505]
      text-black dark:text-white
      border-r border-black/10 dark:border-white/10
      px-4 py-6
      transition-colors duration-300
    ">

      {/* HEADER */}
      <div className="px-2 mb-6">
        <h1 className="text-xl font-black tracking-[0.2em]">
          MRA INVENTORY
        </h1>
        <p className="text-xs text-black/50 dark:text-white/40 mt-2">
          Management System
        </p>
      </div>

      {/* NAV CONTAINER */}
      <div className="
        flex flex-col flex-1 min-h-0
        rounded-3xl
        border border-black/10 dark:border-white/10
        bg-white dark:bg-white/[0.03]
        p-3
        backdrop-blur-xl
        transition-colors duration-300
      ">

        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.name} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    relative flex items-center justify-between
                    px-4 py-3 rounded-2xl
                    transition-all duration-300
                    overflow-hidden

                    ${isActive
                      ? "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                      : "text-black/60 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"}
                  `}
                >

                  {/* ACTIVE GLOW */}
                  {isActive && (
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
                  )}

                  {/* LEFT TEXT */}
                  <span className="relative z-10 text-sm font-semibold">
                    {item.name}
                  </span>

                  {/* ICON */}
                  <div className={`
                    relative z-10 text-lg transition-all duration-300
                    ${isActive ? "scale-110 text-black dark:text-white" : "opacity-70"}
                  `}>
                    {item.icon}
                  </div>

                </motion.div>
              </Link>
            );
          })}

        </div>

        {/* STATUS */}
        <div className="mt-auto pt-4 px-2 border-t border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/40">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            System Active
          </div>
        </div>

      </div>
    </aside>
  );
}