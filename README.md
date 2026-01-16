# ZapChat - Premium Real-Time Chat & Video Calling

ZapChat is a high-performance, production-ready chat application featuring real-time messaging and professional-grade WebRTC video/audio calling.

## 🚀 Key Features

### 📞 Premium WebRTC Calling
- **Crystal Clear Audio/Video**: High-definition peer-to-peer communication.
- **Echo Cancellation (AEC)**: Advanced hardware-level echo cancellation and noise suppression for a professional audio experience.
- **Smart Signaling**: Robust WebRTC negotiation via WebSockets (STOMP/SockJS).
- **Incoming Call Notifications**: Instant browser notifications with the caller's avatar and name.
- **Stability Guard**: Built-in protection against race conditions and concurrent call triggers (no ghost sessions).
- **Auto-Recovery**: Automatic WebRTC service recovery on connection flutters.

### 💬 Real-Time Messaging
- **Instant Delivery**: WebSocket-powered messaging for zero-latency communication.
- **Private & Group Chats**: Seamless switching between one-on-one and team conversations.
- **Typing Indicators**: Real-time feedback when someone is typing.
- **Voice Notes**: WhatsApp-style voice messaging with secure Cloudinary storage.
- **Reactions & Replies**: Interactive chat features including emoji reactions and message threads.

### 🛡️ Modern UI/UX
- **Dark Mode Aesthetic**: A sleek, premium dark interface optimized for focus.
- **Glassmorphism**: Modern UI elements with subtle blurs and gradients.
- **Micro-Animations**: Smooth transitions and pulsing indicators for an "alive" feel.

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, WebRTC API, StompJS.
- **Backend**: Spring Boot, Spring Security, WebSocket with STOMP.
- **Database**: MongoDB (for flexible and scalable data storage).
- **Real-Time**: SockJS, WebRTC Peer-to-Peer Mesh.
- **Media Storage**: Cloudinary (for voice notes and avatars).

## 🔧 Getting Started

### 1. Backend Setup
```bash
cd chat-app-backend
mvn clean install
mvn spring-boot:run
```

### 2. Frontend Setup
```bash
cd frontend-chat
npm install
npm run dev
```

## 📜 Development Philosophy
This project focuses on **Stability**, **Aesthetics**, and **Performance**. We prioritize smooth user transitions and robust state management to ensure a high-quality communication experience.

---
Developed with ❤️ by ZapChat Team
