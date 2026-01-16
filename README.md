# 💬 ZapChat - Real-Time Chat Application

<div align="center">

![ZapChat Logo](https://img.shields.io/badge/ZapChat-Real--Time%20Messaging-blueviolet?style=for-the-badge)
[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge)](https://chatapp-eta-seven.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge)](https://real-time-chat-app-fa35.onrender.com/)

**A modern, feature-rich real-time chat application built with React and Spring Boot**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Deployment](#-deployment) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 💬 **Real-Time Messaging**
- Instant message delivery via WebSocket (STOMP)
- Read receipts (✓✓ for delivered, blue ✓✓ for read)
- Typing indicators
- Message reactions (❤️ 👍 😂 😮 😢 🙏)
- Reply to messages
- Message timestamps

### 📁 **Rich Media Sharing**
- **Image Sharing** - Send photos with preview
- **File Sharing** - Share documents (PDF, DOC, etc.)
- **Voice Notes** - Record and send audio messages
- Cloudinary integration for fast media delivery
- 10MB file size limit

### 📞 **Voice & Video Calls**
- One-on-one voice calls
- HD video calling
- WebRTC peer-to-peer connection
- Call notifications
- Mute/unmute controls
- Camera toggle

### 👥 **Group Chat**
- Create unlimited groups
- Add/remove members
- Group admin controls
- Group profile pictures
- Member list management
- Group messaging with all features

### 🔐 **Authentication & Security**
- Email/Password authentication
- JWT token-based sessions
- BCrypt password hashing
- Secure API endpoints
- Protected routes

### 🎨 **Modern UI/UX**
- WhatsApp-inspired design
- Dark theme
- Responsive layout (mobile & desktop)
- Smooth animations
- Emoji picker
- File upload progress
- Loading states

### 🔔 **Real-Time Updates**
- Online/offline status
- Last seen timestamps
- Message delivery status
- Typing indicators
- Call notifications

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - UI library
- **React Router** - Navigation
- **WebSocket (STOMP.js)** - Real-time messaging
- **WebRTC** - Voice/Video calls
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **React Icons** - Icon library
- **Vite** - Build tool

### **Backend**
- **Spring Boot 3** - Java framework
- **Spring WebSocket** - Real-time communication
- **Spring Security** - Authentication
- **JWT** - Token-based auth
- **MongoDB** - Database
- **Cloudinary** - Media storage
- **Maven** - Build tool

### **Infrastructure**
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Cloud database
- **Cloudinary** - CDN for media

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.8+
- MongoDB (local or Atlas)

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/raziquehasan/Real-Time-chat-app.git
cd Real-Time-chat-app/chat-app-backend/chat-app-backend
```

2. **Configure environment variables**

Create `.env` file:
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zapchat

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=8080
```

3. **Run the backend**
```bash
./mvnw clean install
./mvnw spring-boot:run
```

Backend will run on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend**
```bash
cd ../../frontend-chat
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
```

4. **Run the frontend**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📦 Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure:
   - **Build Command**: `cd chat-app-backend/chat-app-backend && ./mvnw clean install`
   - **Start Command**: `cd chat-app-backend/chat-app-backend && java -jar target/chat-app-backend-0.0.1-SNAPSHOT.jar`
4. Add environment variables (same as `.env`)
5. Deploy!

### Frontend (Vercel)

1. Import project from GitHub
2. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend-chat`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variables:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com
   VITE_WS_URL=https://your-backend.onrender.com
   ```
4. Deploy!

---

## 📸 Screenshots

### Login & Register
Beautiful gradient UI with email/password authentication

### Chat Interface
WhatsApp-inspired design with real-time messaging

### Voice/Video Calls
HD quality calls with WebRTC

### Group Chat
Create and manage group conversations

### Media Sharing
Share images, files, and voice notes

---

## 🏗️ Project Structure

```
Real-Time-chat-app/
├── chat-app-backend/
│   └── chat-app-backend/
│       ├── src/main/java/com/substring/chat/
│       │   ├── config/          # Security, JWT, WebSocket config
│       │   ├── controllers/     # REST & WebSocket endpoints
│       │   ├── entities/        # MongoDB models
│       │   ├── repositories/    # Data access layer
│       │   ├── services/        # Business logic
│       │   └── dto/            # Data transfer objects
│       └── pom.xml
│
└── frontend-chat/
    ├── src/
    │   ├── components/         # Reusable UI components
    │   ├── pages/             # Main pages
    │   ├── services/          # API & WebSocket services
    │   ├── context/           # React context
    │   └── config/            # Routes & config
    └── package.json
```

---

## 🔑 Key Features Implementation

### Real-Time Messaging
- WebSocket connection using STOMP protocol
- Message persistence in MongoDB
- Read receipts tracking
- Typing indicators

### File Uploads
- Cloudinary integration for media storage
- Multipart file upload
- Progress tracking
- Image preview

### Voice/Video Calls
- WebRTC peer connection
- STUN/TURN server configuration
- Call signaling via WebSocket
- Media stream management

### Authentication
- JWT token generation
- Password hashing with BCrypt
- Protected API endpoints
- Token refresh mechanism

---

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login user
POST /api/auth/logout      - Logout user
```

### Messages
```
GET  /api/private-chat/messages/{userId}  - Get chat history
POST /api/private-chat/send-file          - Send file/image
POST /api/private-chat/send-voice-note    - Send voice note
```

### Groups
```
GET    /api/groups                - Get user's groups
POST   /api/groups                - Create group
PUT    /api/groups/{id}           - Update group
DELETE /api/groups/{id}           - Delete group
POST   /api/groups/{id}/members   - Add member
DELETE /api/groups/{id}/members   - Remove member
```

### Calls
```
POST /api/calls/initiate   - Start call
POST /api/calls/accept     - Accept call
POST /api/calls/reject     - Reject call
POST /api/calls/end        - End call
```

### WebSocket Topics
```
/app/private-message       - Send private message
/app/group-message         - Send group message
/app/webrtc-signal         - WebRTC signaling
/user/queue/messages       - Receive messages
/topic/group/{groupId}     - Group messages
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Razique Hasan**
- GitHub: [@raziquehasan](https://github.com/raziquehasan)
- Email: hasanrazique@gmail.com

---

## 🙏 Acknowledgments

- WhatsApp for UI/UX inspiration
- Spring Boot community
- React community
- WebRTC documentation

---

## 📞 Support

For support, email hasanrazique@gmail.com or open an issue on GitHub.

---

<div align="center">

**Made with ❤️ by Razique Hasan**

⭐ Star this repo if you find it helpful!

</div>
