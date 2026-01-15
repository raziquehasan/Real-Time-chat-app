# Changelog

## [Phase 1] Premium Chat Features - 2026-01-15

### ✨ New Features

#### 1. Message Forwarding
- Forward messages to multiple contacts simultaneously
- Support for text, images, documents, and voice notes
- WhatsApp-style "Forwarded" indicator on forwarded messages
- Real-time delivery via WebSocket

#### 2. Message Delete
- **Delete for Me**: Soft delete - removes message from your view only
- **Delete for Everyone**: Removes message for all participants (sender only)
- 5-second undo window with toast notification
- Real-time sync across all clients
- Deleted messages show "This message was deleted" placeholder

#### 3. Message Search
- Client-side search with real-time filtering
- Yellow highlight on matching text
- Result count display (e.g., "3 of 15 results")
- Previous/Next navigation buttons
- Auto-scroll to highlighted message
- Keyboard shortcut: `Ctrl+F` to open search

### 🎨 UI/UX Improvements
- Right-click context menu on all messages (Reply, Forward, Delete)
- Smooth GPU-accelerated animations (200-300ms)
- ForwardModal with multi-select contact list and search
- DeleteConfirmDialog with clear option descriptions
- MessageSearch component with collapsible design
- Keyboard shortcuts: `Ctrl+F` (search), `Escape` (close modals)

### 🔧 Backend Changes

**New Endpoints:**
- `POST /api/private/forward` - Forward message to multiple recipients
- `DELETE /api/private/messages/{messageId}` - Delete message (for me/everyone)
- `GET /api/private/{userId}/search` - Search messages with pagination

**Entity Updates:**
- `PrivateMessage`: Added `forwardedFromId`, `forwardedFromName`, `deletedFor`, `deletedForEveryone`, `deletedAt`

**WebSocket Events:**
- `/user/queue/delete-message` - Real-time delete notifications

### 📁 Files Changed

**Backend:**
- `PrivateMessage.java` - Entity updates
- `ForwardMessageRequest.java` - New payload
- `DeleteMessageRequest.java` - New payload
- `PrivateMessageRepository.java` - Added search query
- `PrivateChatController.java` - Added 3 endpoints

**Frontend:**
- `api.js` - Added 3 API methods
- `ForwardModal.jsx` - New component
- `DeleteConfirmDialog.jsx` - New component
- `MessageSearch.jsx` - New component
- `PrivateChat.jsx` - Integrated all features

### 🔒 Security
- JWT authentication on all endpoints
- Sender-only restriction for "delete for everyone"
- Access validation on forward/delete operations

### 📝 Technical Details
- Soft delete architecture (never hard-deletes from database)
- Case-insensitive regex search with MongoDB
- Optimistic UI updates for better UX
- Efficient WebSocket event handling

### 🚧 Known Limitations
- Long-press for mobile not yet implemented (desktop right-click works)
- Search is client-side only (suitable for < 100 messages)

### 🎯 Next Steps
- Add long-press handler for mobile devices
- Implement server-side search for large chats (1000+ messages)
- Add haptic feedback for mobile interactions
