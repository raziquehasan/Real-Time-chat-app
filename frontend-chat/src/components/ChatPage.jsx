import React, { useEffect, useRef, useState } from "react";
import { MdAttachFile, MdSend } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL } from "../config/AxiosHelper";
import { getMessagess } from "../services/RoomService";
import { timeAgo } from "../config/helper";
import OnlineUsersList from "./OnlineUsersList";
import TypingIndicator from "./TypingIndicator";
import MessageStatusIcon from "./MessageStatusIcon";
import EmojiPicker from "./EmojiPicker";
import MessageReactions from "./MessageReactions";
const ChatPage = () => {
    const {
        roomId,
        currentUser,
        connected,
        setConnected,
        setRoomId,
        setCurrentUser,
    } = useChatContext();
    // console.log(roomId);
    // console.log(currentUser);
    // console.log(connected);

    const navigate = useNavigate();
    useEffect(() => {
        if (!connected) {
            navigate("/");
        }
    }, [connected, roomId, currentUser]);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const inputRef = useRef(null);
    const chatBoxRef = useRef(null);
    const [stompClient, setStompClient] = useState(null);

    // Phase 1 features
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const typingTimeoutRef = useRef(null);

    // Phase 2 features
    const [messageReactions, setMessageReactions] = useState({});
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);

    //page init:
    //messages ko load karne honge

    useEffect(() => {
        async function loadMessages() {
            try {
                const messages = await getMessagess(roomId);
                // console.log(messages);
                setMessages(messages);
            } catch (error) { }
        }
        if (connected) {
            loadMessages();
        }
    }, []);

    //scroll down

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scroll({
                top: chatBoxRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    //stompClient ko init karne honge
    //subscribe

    useEffect(() => {
        const connectWebSocket = () => {
            console.log("🔌 Connecting to WebSocket...");
            console.log("🏠 Room ID:", roomId);
            console.log("👤 User:", currentUser);

            ///SockJS
            const sock = new SockJS(`${baseURL}/chat`);
            const client = Stomp.over(sock);

            // Disable debug mode to reduce console noise
            // client.debug = (str) => {
            //     console.log("STOMP:", str);
            // };

            client.connect(
                {},
                // Success callback
                () => {
                    console.log("✅ WebSocket Connected Successfully!");
                    setStompClient(client);
                    toast.success("Connected to chat room");

                    // Subscribe to room messages
                    client.subscribe(
                        `/topic/room/${roomId}`,
                        (message) => {
                            console.log("📨 Message received:", message);
                            const newMessage = JSON.parse(message.body);
                            setMessages((prev) => [...prev, newMessage]);
                        }
                    );

                    // Subscribe to typing notifications
                    client.subscribe(
                        `/topic/typing/${roomId}`,
                        (message) => {
                            const typing = JSON.parse(message.body);
                            console.log("⌨️ Typing event:", typing);

                            if (typing.userName !== currentUser) {
                                if (typing.isTyping) {
                                    setTypingUsers(prev => [...new Set([...prev, typing.userName])]);
                                } else {
                                    setTypingUsers(prev => prev.filter(u => u !== typing.userName));
                                }
                            }
                        }
                    );

                    // Subscribe to online users updates
                    client.subscribe(
                        `/topic/users/${roomId}`,
                        (message) => {
                            const users = JSON.parse(message.body);
                            console.log("👥 Online users updated:", users);
                            setOnlineUsers(users);
                        }
                    );

                    console.log("✅ Subscribed to all topics for room " + roomId);

                    // Send join event
                    client.send(
                        `/app/join/${roomId}`,
                        {},
                        JSON.stringify({
                            userId: currentUser,
                            userName: currentUser,
                            roomId: roomId
                        })
                    );
                    console.log("👋 Sent join event for user: " + currentUser);

                    // Subscribe to message status updates
                    client.subscribe(
                        `/topic/status/${roomId}`,
                        (message) => {
                            const statusUpdate = JSON.parse(message.body);
                            console.log("📊 Status update received:", statusUpdate);

                            setMessages(prev => prev.map(msg =>
                                msg.messageId === statusUpdate.messageId
                                    ? { ...msg, status: statusUpdate.status }
                                    : msg
                            ));
                        }
                    );

                    // Subscribe to emoji reactions
                    client.subscribe(
                        `/topic/reactions/${roomId}`,
                        (message) => {
                            const reactions = JSON.parse(message.body);
                            console.log("😊 Reactions updated:", reactions);

                            if (reactions.length > 0) {
                                const messageId = reactions[0].messageId;
                                setMessageReactions(prev => ({
                                    ...prev,
                                    [messageId]: reactions
                                }));
                            }
                        }
                    );

                    console.log("✅ Subscribed to status and reactions topics");
                },
                // Error callback
                (error) => {
                    console.error("❌ WebSocket connection error:", error);
                    toast.error("Failed to connect. Please try again.");
                    setConnected(false);
                }
            );
        };

        if (connected && roomId) {
            connectWebSocket();
        }

        // Cleanup function
        return () => {
            if (stompClient && stompClient.connected) {
                console.log("🔌 Disconnecting WebSocket on cleanup");

                // Send leave event before disconnecting
                stompClient.send(
                    `/app/leave/${roomId}`,
                    {},
                    JSON.stringify({
                        userId: currentUser,
                        userName: currentUser,
                        roomId: roomId
                    })
                );

                stompClient.disconnect();
            }
        };
    }, [roomId, connected]);

    //send message handle

    const sendMessage = async () => {
        if (!stompClient || !stompClient.connected) {
            toast.error("Not connected to chat. Please refresh.");
            console.error("❌ Cannot send message: WebSocket not connected");
            return;
        }

        if (!input.trim()) {
            return;
        }

        console.log("📤 Sending message:", input);

        const message = {
            sender: currentUser,
            content: input,
            roomId: roomId,
        };

        try {
            stompClient.send(
                `/app/sendMessage/${roomId}`,
                {},
                JSON.stringify(message)
            );
            console.log("✅ Message sent successfully to /app/sendMessage/" + roomId);
            setInput("");
        } catch (error) {
            console.error("❌ Error sending message:", error);
            toast.error("Failed to send message");
        }
    };      //


    function handleLogout() {
        if (stompClient && stompClient.connected) {
            console.log("🔌 Disconnecting from chat room");

            // Send leave event
            stompClient.send(
                `/app/leave/${roomId}`,
                {},
                JSON.stringify({
                    userId: currentUser,
                    userName: currentUser,
                    roomId: roomId
                })
            );

            stompClient.disconnect();
        }
        setConnected(false);
        setRoomId("");
        setCurrentUser("");
        navigate("/");
    }

    return (
        <div className="flex h-screen">
            {/* Main chat area */}
            <div className="flex-1 flex flex-col">{/* this is a header */}
                <header className="dark:border-gray-700  fixed w-full dark:bg-gray-900 py-5 shadow flex justify-around items-center">
                    {/* room name container */}
                    <div>
                        <h1 className="text-xl font-semibold">
                            Room : <span>{roomId}</span>
                        </h1>
                    </div>
                    {/* username container */}

                    <div>
                        <h1 className="text-xl font-semibold">
                            User : <span>{currentUser}</span>
                        </h1>
                    </div>
                    {/* button: leave room */}
                    <div>
                        <button
                            onClick={handleLogout}
                            className="dark:bg-red-500 dark:hover:bg-red-700 px-3 py-2 rounded-full"
                        >
                            Leave Room
                        </button>
                    </div>
                </header>

                <main
                    ref={chatBoxRef}
                    className="py-20 px-10 w-2/3 dark:bg-slate-700 mx-auto h-screen overflow-auto"
                >
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex mb-4 ${message.sender === currentUser ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`flex flex-col max-w-md ${message.sender === currentUser
                                    ? "bg-green-700 text-white"
                                    : "bg-gray-800 text-white"
                                    } p-3 rounded-lg shadow-lg`}
                            >
                                <div className="flex flex-row gap-3 items-start">
                                    <img
                                        className="h-10 w-10 rounded-full flex-shrink-0"
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender)}&background=random&color=fff`}
                                        alt={message.sender}
                                    />
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white break-words">
                                            {message.sender}
                                        </p>
                                        <p className="text-base text-white break-words leading-relaxed">
                                            {message.content}
                                        </p>
                                        <p className="text-xs text-gray-300 mt-1">
                                            {timeAgo(message.timeStamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </main>
                {/* input message container */}
                <div className=" fixed bottom-4 w-full h-16 ">
                    <div className="h-full  pr-10 gap-4 flex items-center justify-between rounded-full w-1/2 mx-auto dark:bg-gray-900">
                        <input
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);

                                // Send typing notification
                                if (stompClient && stompClient.connected) {
                                    stompClient.send(
                                        `/app/typing/${roomId}`,
                                        {},
                                        JSON.stringify({
                                            roomId,
                                            userName: currentUser,
                                            isTyping: true
                                        })
                                    );

                                    // Clear previous timeout
                                    if (typingTimeoutRef.current) {
                                        clearTimeout(typingTimeoutRef.current);
                                    }

                                    // Stop typing after 3 seconds
                                    typingTimeoutRef.current = setTimeout(() => {
                                        if (stompClient && stompClient.connected) {
                                            stompClient.send(
                                                `/app/typing/${roomId}`,
                                                {},
                                                JSON.stringify({
                                                    roomId,
                                                    userName: currentUser,
                                                    isTyping: false
                                                })
                                            );
                                        }
                                    }, 3000);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    sendMessage();
                                }
                            }}
                            type="text"
                            placeholder="Type your message here..."
                            className=" w-full  dark:border-gray-600 b dark:bg-gray-800  px-5 py-2 rounded-full h-full focus:outline-none  "
                        />

                        <div className="flex gap-1">
                            <button className="dark:bg-purple-600 h-10 w-10  flex   justify-center items-center rounded-full">
                                <MdAttachFile size={20} />
                            </button>
                            <button
                                onClick={sendMessage}
                                className="dark:bg-green-600 h-10 w-10  flex   justify-center items-center rounded-full"
                            >
                                <MdSend size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />

            {/* Online Users Sidebar */}
            <OnlineUsersList
                users={onlineUsers}
                currentUser={currentUser}
                roomId={roomId}
            />
        </div>
    );
};

export default ChatPage;