# ZapChat - The Ultimate Real-Time Communication Platform

ZapChat is a premium, full-stack chat application designed for high-performance messaging and crystal-clear video calling. Built with modern technologies, it focuses on stability, security, and a superior user experience.

## 🚀 Professional WebRTC Calling System

The calling feature in ZapChat is not just a basic implementation; it is a hardened, production-ready system optimized for real-world network conditions.

### 📞 Advanced Calling Features
- **Crystal Clear Audio/Video**: Uses peer-to-peer WebRTC technology for low-latency, high-definition communication.
- **Hardware-Aided Echo Cancellation (AEC)**: Configured with `echoCancellation`, `noiseSuppression`, and `autoGainControl` to ensure professional audio quality without feedback or background noise.
- **Mono-Channel Optimization**: Forced mono-channel audio to allow the browser's native AEC to perform at its peak efficiency.
- **Smart Signaling Architecture**: Uses a robust WebSocket (STOMP/SockJS) signaling layer to negotiate media connections, exchange ICE candidates, and handle call state transitions.
- **Race Condition Protection**: Implemented immediate session tracking via `useRef` to prevent "self-declining" bugs caused by fast backend signaling.
- **Stability Guard**: Prevents "ghost sessions" by blocking redundant call initiations while a call is already in progress.
- **Real-Time UI Feedback**: Professional call interface with pulsing animations, duration timers, and remote stream status indicators.

### 💬 Messaging Features
- **Real-Time Delivery**: WebSocket-powered messaging ensures your messages arrive instantly.
- **Group Management**: Create groups, add/remove members, and exit groups with a seamless UI.
- **WhatsApp-Style Media**: 
  - **Voice Notes**: Recorded and uploaded directly with high-quality compression.
  - **Reactions & Replies**: Engage with messages using emoji reactions or direct thread replies.
  - **Typing Indicators**: Visual feedback when the other person is crafting a reply.

## 🛠️ Technical Architecture

### Frontend Layer
- **React 18**: Utilizing hooks like `useCallback`, `useRef`, and `useMemo` for high-performance renders.
- **Tailwind CSS**: A custom-built design system with glassmorphic elements and dark mode aesthetics.
- **WebRTC Service**: A dedicated service class for managing RTCPeerConnections, local streams, and signaling logic.

### Backend Layer
- **Spring Boot**: Professional Java framework for the core API logic.
- **Spring Security & JWT**: Secure authentication and authorization for all endpoints.
- **STOMP over WebSocket**: A structured messaging protocol for reliable real-time signals.
- **MongoDB**: Schema-less database for flexible chat history and user data.

## ⚙️ Environment Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/chat
```

### Backend (application.properties)
```properties
spring.data.mongodb.uri=your_mongodb_uri
cloudinary.cloud_name=your_cloud_name
cloudinary.api_key=your_api_key
cloudinary.api_secret=your_api_secret
```

## 👨‍💻 Developed By

**Razique Hasan**  
Full Stack Developer  
📧 [hasanrazique@gmail.com](mailto:hasanrazique@gmail.com)  
🌐 [GitHub Profile](https://github.com/raziquehasan)  
🔗 [LinkedIn](https://www.linkedin.com/in/razique-hasan-a65bab232/)  

---
Developed with ❤️ by Razique Hasan
