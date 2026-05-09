# Phase 2 Context: Core Messaging Mobile Interface

## Design Decisions
- **UI Framework:** Custom components strictly matching the existing "Industrial Utilitarian" design system rather than using third-party wrappers like `react-native-gifted-chat`. This ensures complete control over styling, margins, and typography.
- **Chat List Layout:** A unified list interface, potentially using segmented controls to filter between "Direct Messages" and "Channels/Groups".
- **Navigation:** The Chat module should be accessible from the main app navigation (e.g., bottom tab bar or dashboard grid) and use standard stack navigation for drilling into specific conversations.
- **UX Features:** Standard mobile conventions such as pull-to-refresh on the conversation list, and keyboard-aware scroll views for the chat rooms.

## Technical Constraints
- Must integrate cleanly with the Socket.IO setup implemented in Phase 1.
- State management must handle real-time incoming messages gracefully without full re-renders.
