# ZapChat — Real-Time Messaging Platform

**ZapChat** is a modern, production-grade real-time chat application built with **Spring Boot** and **React**, designed for high performance, scalability, and a smooth WhatsApp/Telegram-like user experience.

---

## ✨ Features

### 💬 **Private Messaging**
- Real-time one-on-one chat with WebSocket (STOMP)
- Message forwarding to multiple users
- Message deletion (for me / for everyone)
- Reply to messages
- Message search with highlighting
- Read receipts & delivery status
- Typing indicators
- File sharing with preview
- Message reactions (emoji)

### 👥 **Group Chat**
- Create and manage groups (up to 256 members)
- Role-based permissions (Owner, Admin, Moderator, Member)
- Invite links with unique tokens
- Add/remove members
- @mentions with autocomplete
- Reply threads
- Polls with voting
- Pinned messages
- Group settings & customization
- Real-time member join/leave events

### 📢 **Broadcast Channels**
- Create broadcast-only channels
- Admin-only posting
- Subscriber management
- View tracking on posts
- Reactions & comments
- Channel discovery

### 📞 **Voice & Video Calling**
- One-on-one and Group voice calls
- One-on-one and Group video calls
- Low-latency WebRTC peer-to-peer streaming
- Real-time signaling via WebSocket (SDP/ICE)
- Incoming call notifications with ringtones
- Call history and session logs
- Camera and microphone toggle controls
- Full-screen video mode

### 🔔 **Smart Notifications**
- Real-time push notifications
- Do Not Disturb (DND) mode with time windows
- Muted chats support
- Notification type filtering (messages, mentions, files, group invites)
- Sound toggle
- Mark as read / Mark all as read
- Notification settings panel

### ⚡ **Performance Optimizations**
- Message virtualization for 1000+ messages (react-window)
- Lazy loading with pagination
- Optimized re-renders with React.memo
- Debounced search (300ms)
- MongoDB indexes for fast queries
- Skeleton loaders for better UX

### 🎨 **Premium UI/UX**
- Dark theme with WhatsApp-inspired design
- Smooth animations (200-300ms transitions)
- Slide-in panels & modals
- Context menus with smart positioning
- Empty states & loading skeletons
- Mobile responsive design
- Professional color palette

### 🔐 **Security**
- JWT authentication
- Role-based access control (RBAC)
- Permission validation on all actions
- Secure WebSocket connections
- Password encryption

---

## 🏗️ Tech Stack

### **Backend**
- **Framework:** Spring Boot 3.x
- **Database:** MongoDB
- **WebSocket:** STOMP over SockJS
- **Authentication:** JWT (JSON Web Tokens)
- **Build Tool:** Maven

### **Frontend**
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **WebSocket Client:** SockJS + STOMP
- **UI Components:** Custom components
- **Icons:** React Icons (Feather Icons)
- **Date Formatting:** date-fns
- **Notifications:** react-hot-toast
- **Virtualization:** react-window

---

## 📁 Project Structure

```
chat-app/
├── chat-app-backend/          # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/substring/chat/
│   │       ├── entities/      # MongoDB entities
│   │       ├── repositories/  # Data access layer
│   │       ├── services/      # Business logic
│   │       ├── controllers/   # REST & WebSocket controllers
│   │       └── config/        # Security & WebSocket config
│   └── pom.xml
│
└── frontend-chat/             # React frontend
    ├── src/
    │   ├── components/        # React components
    │   ├── services/          # API & WebSocket services
    │   └── App.jsx            # Main app component
    └── package.json
```

---

## 🚀 Getting Started

### **Prerequisites**
- Java 17+
- Node.js 18+
- MongoDB 6.0+
- Maven 3.8+

### **Backend Setup**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zapchat.git
   cd zapchat/chat-app-backend
   ```

2. **Configure MongoDB**
   Update `application.properties`:
   ```properties
   spring.data.mongodb.uri=mongodb://localhost:27017/zapchat
   jwt.secret=your-secret-key
   ```

3. **Run the backend**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
   Backend runs on `http://localhost:8080`

### **Frontend Setup**

1. **Navigate to frontend**
   ```bash
   cd ../frontend-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL**
   Update `src/services/api.js`:
   ```javascript
   const API_URL = 'http://localhost:8080';
   ```

4. **Run the frontend**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

---

## 📊 Database Schema

### **Collections**
- `users` - User profiles
- `private_messages` - One-on-one messages
- `groups` - Group metadata
- `group_members` - Group membership with roles
- `group_messages` - Group chat messages
- `channels` - Broadcast channels
- `channel_messages` - Channel posts
- `notifications` - User notifications
- `notification_settings` - Notification preferences
- `call_sessions` - Call history and session metadata

---

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### 📞 **Call Management**
- `POST /api/calls/start` - Initiate a call
- `POST /api/calls/{id}/accept` - Accept an incoming call
- `POST /api/calls/{id}/decline` - Decline an incoming call
- `POST /api/calls/{id}/end` - End an active call
- `GET /api/calls/history` - View call log history

### **Private Chat**
- `GET /api/private/{userId}/messages` - Get messages
- `POST /api/private/send` - Send message
- `POST /api/private/forward` - Forward message
- `DELETE /api/private/delete` - Delete message
- `GET /api/private/{userId}/search` - Search messages

### **Groups**
- `POST /api/groups` - Create group
- `GET /api/groups/my` - Get user's groups
- `POST /api/groups/join/{inviteLink}` - Join via invite
- `POST /api/groups/{id}/members` - Add member
- `DELETE /api/groups/{id}/members/{userId}` - Remove member
- `PUT /api/groups/{id}/members/{userId}/role` - Update role
- `POST /api/groups/{id}/messages` - Send message
- `POST /api/groups/{id}/messages/polls` - Create poll
- `PUT /api/groups/{id}/messages/pin/{messageId}` - Pin message

### **Channels**
- `POST /api/channels` - Create channel
- `GET /api/channels/my` - Get subscribed channels
- `POST /api/channels/{id}/subscribe` - Subscribe
- `POST /api/channels/{id}/messages` - Broadcast message

### **Notifications**
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/settings` - Get settings
- `PUT /api/notifications/settings` - Update settings

---

## 🎯 Key Features Implementation

### **Real-Time Messaging**
Uses STOMP over WebSocket for bidirectional communication:
- `/topic/user/{userId}` - Private messages
- `/topic/group/{groupId}` - Group messages
- `/topic/channel/{channelId}` - Channel broadcasts

### **Role-Based Permissions**
| Action | Owner | Admin | Moderator | Member |
|--------|-------|-------|-----------|--------|
| Send Message | ✅ | ✅ | ✅ | ✅ |
| Add Member | ✅ | ✅ | ❌ | ❌ |
| Remove Member | ✅ | ✅ | ❌ | ❌ |
| Edit Group | ✅ | ✅ | ❌ | ❌ |
| Delete Group | ✅ | ❌ | ❌ | ❌ |
| Assign Role | ✅ | ❌ | ❌ | ❌ |
| Pin Message | ✅ | ✅ | ✅ | ❌ |
| Delete Message | ✅ | ✅ | ✅ | ❌ |

### **Performance Optimizations**
- **Virtualization:** Only renders visible messages (handles 10,000+ messages)
- **Pagination:** Loads 50 messages at a time
- **Indexes:** MongoDB compound indexes on frequently queried fields
- **Memoization:** React.memo prevents unnecessary re-renders
- **Debouncing:** 300ms delay on search input

---

## 🧪 Testing

```bash
# Backend tests
cd chat-app-backend
mvn test

# Frontend tests
cd frontend-chat
npm test
```

---

## 📦 Deployment

### **Production Build**

**Backend:**
```bash
mvn clean package
java -jar target/chat-app-backend-0.0.1-SNAPSHOT.jar
```

**Frontend:**
```bash
npm run build
# Deploy dist/ folder to Vercel/Netlify
```

### **Docker**
```bash
docker-compose up -d
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@raziquehasan](https://github.com/raziquehasan)
- Email: hasanrazique@gmail.com

---

## 🙏 Acknowledgments

- Inspired by WhatsApp and Telegram
- Built with ❤️ using Spring Boot and React
- Built by Razique Hasan

---

## 📈 Roadmap

- [x] Voice messages (Voice Notes)
- [x] Video calls
- [ ] End-to-end encryption
- [ ] Message translation
- [ ] Stickers & GIFs
- [ ] Desktop app (Electron)
- [ ] Mobile apps (React Native)

---

**⚡ ZapChat - Lightning-fast communication for the modern web!**
