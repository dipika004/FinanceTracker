import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { FaPlus, FaTrash, FaSearch } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatSidebar = forwardRef(({ selectedChatId, onSelectChat, onNewChat }, ref) => {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchChats = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const res = await axios.get("https://financetracker-backend-tv60.onrender.com/api/chat/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // ✅ Allow parent components to call `refreshChats()`
  useImperativeHandle(ref, () => ({
    refreshChats: fetchChats,
  }));

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this chat?");
    if (!confirmDelete) return; // 🚫 stop if user cancels

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`https://financetracker-backend-tv60.onrender.com/api/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats((prev) => prev.filter((c) => c._id !== id));
      if (selectedChatId === id) onSelectChat(null);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        console.error(err);
      }
    }
  };

  const filteredChats = chats.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="bg-dark text-white p-3"
      style={{ width: "250px", height: "100vh", overflowY: "auto" }}
    >
      <div className="d-flex mb-3">
        <input
          type="text"
          className="form-control me-2 bg-secondary text-white border-0"
          placeholder="Search chat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FaSearch className="mt-2" />
      </div>

      <button
        className="btn btn-info w-100 mb-3"
        onClick={async () => {
          const newChat = await onNewChat();
          fetchChats();
          if (newChat) onSelectChat(newChat._id);
        }}
      >
        <FaPlus /> New Chat
      </button>

      {filteredChats.map((chat) => (
        <div
          key={chat._id}
          className={`d-flex justify-content-between align-items-center p-2 mb-2 rounded ${
            selectedChatId === chat._id ? "bg-primary" : "bg-secondary"
          }`}
          onClick={() => onSelectChat(chat._id)}
        >
          <span>{chat.title || "Untitled Chat"}</span>
          <FaTrash
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation(); // prevents chat from being selected when deleting
              handleDelete(chat._id);
            }}
          />
        </div>
      ))}
    </div>
  );
});

export default ChatSidebar;
