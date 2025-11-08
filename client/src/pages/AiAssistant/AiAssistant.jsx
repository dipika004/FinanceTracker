import React, { useRef, useState } from "react";
import ChatSidebar from "../../components/ChatSideBar.jsx";
import ChatWindow from "../../components/ChatWindow.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AIAssistant() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const sidebarRef = useRef();
  const navigate = useNavigate();

  const createNewChat = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const res = await axios.post(
        "https://financetracker-backend-tv60.onrender.com/api/chat/new",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // After new chat, refresh sidebar
      sidebarRef.current?.refreshChats();
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  return (
    <div className="d-flex">
      <ChatSidebar
        ref={sidebarRef}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onNewChat={createNewChat}
      />
      {/* <ChatWindow chatId={selectedChatId} onRefreshSidebar={() => sidebarRef.current?.refreshChats()} /> */}
      <ChatWindow chatId={selectedChatId} onChatUpdate={() => sidebarRef.current?.refreshChats()} />
    </div>
  );
}
