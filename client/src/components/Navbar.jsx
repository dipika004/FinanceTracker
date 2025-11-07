import { NavLink } from "react-router-dom";
import {
  Home,
  Target,
  Brain,
  Settings,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const Navbar = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { name: "Dashboard", icon: <Home size={20} />, path: "/dashboard" },
    { name: "AI Assistant", icon: <Brain size={20} />, path: "/ai-assistant" },
    { name: "Goals", icon: <Target size={20} />, path: "/goals" },
    { name: "Add Goal", icon: <Target size={20} />, path: "/add-goal" },
    { name: "Transaction", icon: <Target size={20} />, path: "/transactions" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  const asideClass = [
    "fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out",
    isOpen ? "translate-x-0" : "-translate-x-full",
    "md:translate-x-0",
    isOpen ? "md:w-64" : "md:w-20",
    "bg-gradient-to-b from-[#080d1a] via-[#0d1222] to-[#151b2e] backdrop-blur-2xl border-r border-[#38bdf8]/10 shadow-[0_0_25px_rgba(56,189,248,0.2)]",
    "flex flex-col overflow-y-auto no-scrollbar",
  ].join(" ");

  return (
    <>
      {/* Mobile Toggle */}
      <button
        type="button"
        className="fixed top-4 left-4 z-[60] bg-[#0f172a]/70 backdrop-blur-md border border-[#38bdf8]/20 p-2 rounded-xl text-[#38bdf8] md:hidden hover:bg-[#38bdf8]/10 transition-all duration-300"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={asideClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#38bdf8]/10">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center rounded-lg ${
                isOpen ? "w-10 h-10" : "w-8 h-8"
              } bg-[#061024] shadow-[0_0_10px_rgba(56,189,248,0.35)]`}
            ></div>

            <div className={`${isOpen ? "block" : "hidden md:block"}`}>
              <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-cyan-400 to-[#60a5fa] font-extrabold text-lg tracking-wide drop-shadow-[0_0_8px_rgba(56,189,248,0.45)]">
                Lakshmi Loop
              </h1>
              <p className="text-[12px] text-gray-400 tracking-widest uppercase font-light">
                Smart Finance Tracker
              </p>
            </div>
          </div>

          {/* Collapse Toggle */}
          <div className="ml-auto hidden md:inline-flex">
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="p-2 rounded-md bg-[#0b1020]/40 hover:bg-[#38bdf8]/10 transition-all"
              aria-label="Collapse sidebar"
            >
              {isOpen ? (
                <ChevronsLeft size={18} className="text-[#38bdf8]" />
              ) : (
                <ChevronsRight size={18} className="text-[#38bdf8]" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-5 space-y-3">
          {navItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) => {
                const base =
                  "group flex items-center rounded-lg transition-all duration-300 font-medium select-none";
                const padding = isOpen
                  ? "px-4 py-3 gap-3"
                  : "p-3 justify-center";
                const active = isActive
                  ? "bg-[#1e293b]/60 text-[#38bdf8] shadow-[inset_0_0_12px_rgba(56,189,248,0.25)]"
                  : "text-gray-400 hover:text-[#38bdf8] hover:bg-[#1e293b]/40 hover:shadow-[0_0_10px_rgba(56,189,248,0.2)]";

                return `${base} ${padding} ${active}`;
              }}
              onClick={() => window.innerWidth < 768 && setIsOpen(false)}
            >
              <div className="transition-transform duration-300 group-hover:scale-110 text-cyan-300">
                {item.icon}
              </div>
              <span
                className={`${
                  isOpen ? "inline-block" : "hidden md:inline-block"
                } text-[15px] font-semibold tracking-wide transition-all duration-300`}
              >
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 text-center border-t border-[#38bdf8]/10 mt-auto">
          <p className="text-[11px] text-gray-500 tracking-widest uppercase font-light">
            © 2025{" "}
            <span className="font-semibold text-cyan-400">Lakshmi Loop</span>
          </p>
          <p className="text-[10px] text-gray-500 italic mt-1">
            Empowering mindful money habits.
          </p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navbar;
