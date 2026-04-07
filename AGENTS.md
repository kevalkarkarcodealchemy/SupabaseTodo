# AI Agents Configuration

## 🧠 Planner Agent
Role:
- Break down features into steps
- Suggest architecture and approach before coding

Responsibilities:
- Task decomposition
- High-level decisions
- Identifying risks and edge cases

Rules:
- Do not write full code
- Focus on clarity and structure

---

## 💻 Coder Agent
Role:
- Write clean, production-ready code

Responsibilities:
- Implement features
- Follow existing architecture strictly
- Reuse components and utilities

Rules:
- Always follow project patterns
- Do not introduce new libraries without justification
- Keep code minimal and readable

---

## 🔍 Reviewer Agent
Role:
- Review and improve code quality

Responsibilities:
- Detect bugs and edge cases
- Suggest refactoring
- Ensure consistency

Rules:
- Do not rewrite everything unnecessarily
- Focus on improvements only

---

## 🏗️ Project Rules (VERY IMPORTANT)
- Architecture Rules: Feature-based folder grouping within `src/screens`. Global configuration and services placed in `src/utils`, `src/store`, and `src/services`.
- Folder Structure:
  - `src/navigation/`: App routing and nested stack navigators.
  - `src/screens/`: Grouped by domain (e.g., `auth`, `app`).
  - `src/services/`: API clients, such as Supabase base setup.
  - `src/store/`: Global Zustand stores.
  - `src/assets/svg/`: Reusable SVG components.
  - `src/theme/`, `src/types/`, `src/utils/`: Shared generic code.
- State Management: Uses **Zustand**. Keep state logic (including async API calls) decoupled from screens and centralized in individual stores (e.g., `useAuthStore.js`).
- API Handling: Uses **Supabase** (auth and data). Perform Supabase calls inside the Zustand stores to manage loading states and data centrally. For REST APIs outside Supabase, use **Axios**.
- Styling Conventions: Use **React Native `StyleSheet`**. No Tailwind or styled-components. SVGs are directly built using `react-native-svg`. Follow a clean, modern aesthetic with descriptive style names (e.g., `primaryButton`, `socialButton`).
- Navigation: Uses **React Navigation v7**. Maintain clean stack definitions (`AppNavigator`, `AuthNavigator`) and separate authenticated and unauthenticated flows.

---

## ⚙️ Coding Standards
- **Language**: React Native, React 19, modern JavaScript.
- **Naming Conventions**: 
  - PascalCase for React components and screen files (e.g., `LoginScreen.js`).
  - camelCase for functions, variables, and Zustand hooks (e.g., `useAuthStore`).
  - Descriptive `handle*` prefixes for event callbacks (e.g., `handleLogin`).
- **Error Handling**: Use `try/catch` and present meaningful messages via `Alert.alert` to the user. Centralize API error catching within store methods.
- **Async Patterns**: Use async/await standard over `.then()`. Manage UI loading feedback via local state (e.g., `loading` booleans).

---

## 🚫 Global Do & Don’t
- **DO** use `KeyboardAvoidingView`, `ScrollView`, and `SafeAreaContext` to handle device-specific layouts effectively.
- **DO** reuse existing Zustand stores rather than passing props deeply.
- **DO** put API calls in stores or services, NOT directly within React component interactions if it impacts global state.
- **DON'T** introduce new external libraries unless strictly required (use existing standard libraries like `@react-native-async-storage/async-storage`).
- **DON'T** mix styling approaches (stick exclusively to `StyleSheet.create`).
- **DON'T** leave unhandled exceptions for authentication or data fetching—always `try/catch`.

---

## 🧪 Common Workflows

### Adding a Feature
1. Planner defines approach
2. Coder implements
3. Reviewer validates

### Refactoring
- Reviewer suggests → Coder applies

---

## 💬 Communication Style
- Concise
- Actionable
- No fluff
