# **App Name**: StreamForge

## Core Features:

- Dynamic Button Grid: Display a customizable button grid.
- Hardware Bridge: Link the Flutter app to the DeckSurf backend for real-time hardware interaction using a local bridge/API (C# or Node.js).
- Drag-and-Drop Config: Enable drag-and-drop configuration of commands and actions for each button on the grid.
- Profile Management: Allow users to save and manage different profiles for various use cases, synced via Firebase.
- Cloud Sync: Sync user profiles and button configurations across devices using Firebase Firestore.
- Plugin Support: Support running custom plugins or scripts on button presses, triggered either locally or via cloud functions.
- Smart Actions: A tool to provide AI-driven suggestions for command sequences based on detected running applications.

## Style Guidelines:

- Primary color: A deep purple (#6750A4) evokes professionalism and innovation.
- Background color: A dark gray (#121212) creating a modern, focused user experience, conducive to long sessions, also providing strong contrast with the purple.
- Accent color: A vibrant blue (#52B6DF) for interactive elements like buttons and highlights to draw user attention.
- Clean and modern sans-serif font for both UI elements and configurable text labels on buttons. Font size and weight should be easily adjustable.
- Use a set of minimalistic, consistent icons for commands, actions, and app functions. These icons should be easily recognizable and customizable by the user.
- Grid-based layout for buttons, ensuring easy alignment and scaling across different screen sizes. Configurable grid size to match different models.
- Subtle animations on button presses to provide visual feedback and enhance the user experience, ensuring that it's both responsive and satisfying to use.