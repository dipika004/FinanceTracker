import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaRobot, FaUser, FaEdit, FaSave } from "react-icons/fa";
import axios from "axios";

export default function ChatWindow({ chatId, onChatUpdate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatId) fetchChat();
  }, [chatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChat = async () => {
    if (!chatId) return;
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`https://financetracker-backend-tv60.onrender.com/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ========= SEND MESSAGE =========
  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!chatId) {
      alert("Select a chat first!");
      return;
    }

    const token = localStorage.getItem("token");
    const messageToSend = input;
    setMessages((prev) => [...prev, { sender: "user", text: messageToSend }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        `https://financetracker-backend-tv60.onrender.com/api/chat/${chatId}/message`,
        { message: messageToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, { sender: "ai", text: res.data.reply }]);

      // ✅ If this is the first user message, set chat title dynamically
      if (messages.length === 0) {
        const title =
          messageToSend.length > 30
            ? messageToSend.substring(0, 30) + "..."
            : messageToSend;

        await axios.put(
          `https://financetracker-backend-tv60.onrender.com/api/chat/${chatId}/title`,
          { title },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // 🔁 Refresh sidebar so title shows immediately
        if (onChatUpdate) onChatUpdate();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Server error. Try again." },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setInput(messages[index].text);
  };

  // ========= SAVE EDIT =========
  const saveEdit = async () => {
    if (editingIndex === null || !input.trim()) return;

    const editedMessage = { ...messages[editingIndex], text: input, edited: true };
    const editedMessageId = editedMessage._id;
    const updated = [...messages];
    updated[editingIndex] = editedMessage;
    setMessages(updated);
    setEditingIndex(null);

    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await axios.post(
        `https://financetracker-backend-tv60.onrender.com/api/chat/${chatId}/message`,
        {
          message: input,
          edited: true,
          editedMessageId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newAIReply = res.data.reply;

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._id && m._id.toString() === editedMessageId);
        const copy = [...prev];

        const nextAiIndex = (() => {
          for (let i = idx + 1; i < prev.length; i++) {
            if (prev[i].sender === "ai") return i;
          }
          return -1;
        })();

        if (nextAiIndex !== -1) {
          copy[nextAiIndex] = { ...copy[nextAiIndex], text: newAIReply };
        } else {
          copy.splice(idx + 1, 0, { sender: "ai", text: newAIReply });
        }

        return copy;
      });
    } catch (err) {
      console.error("Error sending edited message:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Server error while reprocessing your message." },
      ]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow-1 d-flex flex-column" style={{ height: "100vh" }}>
      <div className="flex-grow-1 overflow-auto p-3" style={{ background: "#0d1117" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`d-flex mb-2 ${
              msg.sender === "user" ? "justify-content-end" : "justify-content-start"
            }`}
          >
            <div
              className={`p-3 rounded-4 text-white shadow-sm ${
                msg.sender === "user" ? "bg-primary" : "bg-secondary"
              }`}
              style={{ maxWidth: "70%", position: "relative" }}
            >
              <div className="d-flex align-items-center mb-1">
                {msg.sender === "ai" ? (
                  <FaRobot className="me-2 text-info" />
                ) : (
                  <FaUser className="me-2 text-warning" />
                )}
                <strong>{msg.sender === "ai" ? "AI" : "You"}</strong>
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
              {msg.sender === "user" && editingIndex === null && (
                <FaEdit
                  style={{ position: "absolute", top: 5, right: 5, cursor: "pointer" }}
                  onClick={() => handleEdit(i)}
                />
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-light">AI is typing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 d-flex bg-dark border-top">
        <input
          type="text"
          className="form-control bg-secondary text-white border-0 me-2"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {editingIndex !== null ? (
          <button className="btn btn-success" onClick={saveEdit}>
            <FaSave />
          </button>
        ) : (
          <button className="btn btn-info" onClick={sendMessage}>
            <FaPaperPlane />
          </button>
        )}
      </div>
    </div>
  );
}
