import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

function MainLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex bg-[#0b1020] text-white min-h-screen overflow-hidden">
      <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main
        className={`flex-1 overflow-y-auto h-screen transition-all duration-300 ease-in-out p-6 ${
          isOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
