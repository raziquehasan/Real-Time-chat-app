# 💬 Real-Time Chat Application

A modern, feature-rich real-time chat application built with React and Spring Boot, featuring WebSocket communication, file sharing, message reactions, typing indicators, and user presence tracking.

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.9-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP-yellow)

## ✨ Features

### 🎯 Core Features
- **Real-time Messaging**: Instant message delivery using WebSocket (STOMP protocol)
- **Room-based Chat**: Create and join chat rooms with unique room IDs
- **File Sharing**: Upload and download files within chat rooms
- **Message Reactions**: React to messages with emojis
- **Typing Indicators**: See when other users are typing
- **User Presence**: Track online/offline status of users
- **Message Status**: Track message delivery and read receipts
- **Message Pagination**: Efficient loading of chat history

### 🎨 UI/UX Features
- Modern, responsive design with Tailwind CSS
- Emoji picker for reactions
- File attachments with preview
- Toast notifications for user feedback
- Clean and intuitive interface

## 🏗️ Architecture

### Backend (Spring Boot)
```
chat-app-backend/
├── src/main/java/com/substring/chat/
│   ├── controllers/          # REST & WebSocket controllers
│   │   ├── ChatController.java
│   │   ├── RoomController.java
│   │   ├── FileUploadController.java
│   │   ├── ReactionController.java
│   │   ├── TypingController.java
│   │   ├── UserPresenceController.java
│   │   └── MessageStatusController.java
│   ├── entities/             # MongoDB entities
│   │   ├── Room.java
│   │   ├── Message.java
│   │   ├── MessageReaction.java
│   │   ├── TypingNotification.java
│   │   └── UserPresence.java
│   ├── repositories/         # MongoDB repositories
│   └── config/              # WebSocket & CORS configuration
└── src/main/resources/
    └── application.yaml      # Application configuration
```

### Frontend (React + Vite)
```
frontend-chat/
├── src/
│   ├── components/          # React components
│   │   ├── JoinCreateChat.jsx
│   │   ├── ChatRoom.jsx
│   │   ├── EmojiPicker.jsx
│   │   ├── FileUpload.jsx
│   │   └── FileAttachment.jsx
│   ├── config/
│   │   └── Routes.jsx       # Routing configuration
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Application entry point
└── package.json
```

## 🛠️ Technology Stack

### Backend
- **Framework**: Spring Boot 3.5.9
- **Language**: Java 17
- **Database**: MongoDB
- **WebSocket**: Spring WebSocket with STOMP
- **Build Tool**: Maven
- **Additional Libraries**:
  - Lombok (for boilerplate reduction)
  - Spring Data MongoDB
  - Spring Boot DevTools

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.0.1
- **Styling**: Tailwind CSS 3.4.16
- **WebSocket Client**: @stomp/stompjs 7.0.0, sockjs-client 1.6.1
- **HTTP Client**: Axios 1.7.9
- **Routing**: React Router 7.0.2
- **UI Libraries**:
  - react-hot-toast (notifications)
  - react-icons (icon library)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Java 17** or higher
- **Maven 3.6+**
- **Node.js 16+** and **npm**
- **MongoDB** (running on localhost:27017)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/raziquehasan/Real-Time-chat-app.git
cd Real-Time-chat-app
```

### 2. Backend Setup

#### Navigate to backend directory
```bash
cd chat-app-backend/chat-app-backend
```

#### Configure MongoDB
Edit `src/main/resources/application.yaml` if needed:
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/chatapp
```

#### Run the backend
```bash
# Using Maven wrapper (Windows)
.\mvnw.cmd spring-boot:run

# Using Maven wrapper (Linux/Mac)
./mvnw spring-boot:run

# Or using installed Maven
mvn spring-boot:run
```

The backend will start on **http://localhost:8080**

### 3. Frontend Setup

#### Navigate to frontend directory (from project root)
```bash
cd frontend-chat
```

#### Install dependencies
```bash
npm install
```

#### Run the development server
```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

## 📡 API Documentation

### REST Endpoints

#### Room Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rooms` | Create a new chat room |
| GET | `/api/v1/rooms/{roomId}` | Get room details / Join room |
| GET | `/api/v1/rooms/{roomId}/messages` | Get room messages (paginated) |

**Query Parameters for Messages:**
- `page` (default: 0)
- `size` (default: 20)

#### File Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/files/upload` | Upload a file |
| GET | `/api/v1/files/download/{filename}` | Download a file |

### WebSocket Endpoints

#### Connection
- **Connect to**: `ws://localhost:8080/chat`
- **Protocol**: STOMP over SockJS

#### Message Destinations

| Type | Destination | Description |
|------|-------------|-------------|
| Send | `/app/sendMessage/{roomId}` | Send a message to a room |
| Subscribe | `/topic/room/{roomId}` | Receive messages from a room |
| Send | `/app/typing/{roomId}` | Send typing notification |
| Subscribe | `/topic/typing/{roomId}` | Receive typing notifications |
| Send | `/app/reaction` | Send message reaction |
| Subscribe | `/topic/reactions/{roomId}` | Receive reactions |
| Send | `/app/presence` | Update user presence |
| Subscribe | `/topic/presence/{roomId}` | Receive presence updates |
| Send | `/app/message-status` | Update message status |
| Subscribe | `/topic/message-status/{roomId}` | Receive status updates |

## 💻 Usage Guide

### Creating/Joining a Room

1. Open the application at `http://localhost:5173`
2. Enter your name and a room ID
3. Click "Create Room" to create a new room or "Join Room" to join an existing one

### Sending Messages

1. Type your message in the input field
2. Press Enter or click Send
3. Messages appear in real-time for all users in the room

### Uploading Files

1. Click the file upload button
2. Select a file from your device
3. The file will be uploaded and shared in the chat

### Reacting to Messages

1. Hover over a message
2. Click the reaction button
3. Select an emoji from the picker

## 🔧 Configuration

### Backend Configuration

**Port Configuration**: Default port is 8080. To change, add to `application.yaml`:
```yaml
server:
  port: 8080
```

**CORS Configuration**: Currently configured for `http://localhost:5173`. Update in controller annotations if needed.

**File Upload Directory**: Files are stored in `uploads/` directory in the backend root.

### Frontend Configuration

**API Base URL**: Update in your API service files if backend URL changes.

**WebSocket URL**: Update in WebSocket configuration if backend URL/port changes.

## 📁 File Structure Details

### Key Backend Files
- `ChatController.java`: Handles WebSocket message routing
- `RoomController.java`: REST API for room operations
- `FileUploadController.java`: File upload/download handling
- `WebSocketConfig.java`: WebSocket configuration
- `Room.java`: Room entity with embedded messages

### Key Frontend Files
- `JoinCreateChat.jsx`: Landing page for room creation/joining
- `ChatRoom.jsx`: Main chat interface
- `App.jsx`: Root component with routing

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
```
Ensure MongoDB is running: mongod
Check connection string in application.yaml
```

**Port 8080 Already in Use**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

### Frontend Issues

**WebSocket Connection Failed**
- Ensure backend is running on port 8080
- Check CORS configuration in backend
- Verify WebSocket endpoint URL

**Dependencies Installation Failed**
```bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Razique Hasan**
- GitHub: [@raziquehasan](https://github.com/raziquehasan)

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- React team for the amazing library
- MongoDB for the flexible database
- All contributors and users of this project

## 📞 Support

For support, email your-email@example.com or create an issue in the GitHub repository.

---

**Happy Chatting! 💬✨**
