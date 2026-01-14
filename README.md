# 💬 Real-Time WhatsApp-Style Chat Application

A premium, production-ready real-time private chat application built with **React** and **Spring Boot**. Features include high-performance WebSocket communication, Cloudinary-integrated media sharing, real-time presence tracking, and a sleek WhatsApp-inspired UI.

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.9-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Integrated-blue)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP-yellow)
![Security](https://img.shields.io/badge/Security-JWT-red)

## ✨ Key Features

### 📨 Advanced Messaging
- **1-on-1 Private Chat**: Scalable private messaging with MongoDB persistence.
- **WhatsApp UI Experience**: Rounded bubbles, checkmarks (✓/✓✓), and a familiar chat background.
- **Real-time Delivery**: Instant message broadcasting using STOMP over WebSockets.
- **Typing Indicators**: Visual feedback when the recipient is typing.
- **Read Receipts**: Real-time status updates for sent and read messages.
- **Emoji Reactions**: Express feelings with hover-enabled message reactions.
- **Threaded Replies**: Quote and contextually reply to specific messages with click-to-scroll navigation.
- **Voice Notes**: Record and send voice messages (up to 60s) with an integrated audio player.

### 📁 Media & File Sharing
- **Cloudinary Integration**: Production-ready storage for images, documents, and audio.
- **Integrated Upload**: Seamless delivery for images, PDFs, DOCs, and Voice Notes.
- **Previews**: High-quality image previews and dedicated file cards for documents.
- **Progress Tracking**: Dynamic upload progress bar for all shared media.
- **Security**: 10MB file size limit and strict file type validation (Images/Audio/PDF/DOC/TXT).

### 👤 User Identity & Presence
- **Personal Profiles**: Manage your Avatar, Bio (About), and Phone number.
- **Live Presence**: Real-time "Online" indicator and "Last Seen" timestamps.
- **User Discovery**: Searchable user list to start new conversations.

## 🛠️ Technology Stack

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.5.9 (Java 17)
- **Database**: MongoDB (Atlas)
- **Security**: Spring Security + JJWT 0.12.3
- **File Storage**: Cloudinary SDK
- **WebSockets**: Spring Messaging (STOMP)
- **Environment**: `dotenv-java` for secure credential management

### Frontend (React)
- **Framework**: React 18 + Vite
- **WebSocket Client**: `@stomp/stompjs`
- **Styling**: Vanilla CSS + Tailwind for layout
- **Icons**: `react-icons` (Feather, FontAwesome)
- **State Management**: React Context API
- **Dates**: `date-fns` for relative time formatting

## 🚀 Getting Started

### 1. Prerequisites
- **Java 17** & **Node.js 18+**
- **MongoDB Atlas** account (or local MongoDB)
- **Cloudinary** account for file sharing

### 2. Backend Configuration
Create a `.env` file in `chat-app-backend/chat-app-backend/`:
```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_complex_base64_secret
JWT_EXPIRATION=86400000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Server
PORT=8080
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Installation & Launch

**Backend:**
```bash
cd chat-app-backend/chat-app-backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend-chat
npm install
npm run dev
```

## 📡 Core API & WebSockets

### Private Chat REST
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/private/{userId}/messages` | Get chat history |
| POST | `/api/private/send-file` | Integrated file/media/audio send |
| POST | `/api/private/mark-read/{senderId}` | Mark messages as read |
| PUT  | `/api/private/react` | Toggle emoji reactions on messages |
| GET  | `/api/private/conversations` | Get user's active chats |

### WebSocket Destinations
- **Connection**: `ws://localhost:8080/chat`
- **Sub /user/queue/messages**: Receive incoming private messages.
- **Sub /user/queue/typing**: Receive typing indicators.
- **Sub /user/queue/reactions**: Receive real-time reaction updates.
- **Pub /app/private**: Send text messages and replies.
- **Pub /app/typing**: Send typing status.

## 👨‍💻 Author
**Razique Hasan**
- GitHub: [@raziquehasan](https://github.com/raziquehasan)

---
**Happy Chatting! 💬✨**
