# Mood Aware Personal

A full-stack, cross-platform application that tracks your daily diary entries and automatically detects your mood using sentiment analysis. The application provides a user-friendly interface for writing diary entries, visualizing mood trends over time, and offers insights based on your emotional patterns.

## 🚀 Features

-   **Mood Detection**: Analyzes text to determine if you are Happy, Sad, Good, or Bad.
-   **Cross-Platform**: Accessible via Web (Next.js) and Mobile (React Native/Expo).
-   **Unified Backend**: Custom Express API with MongoDB storage.
-   **Monorepo Architecture**: Managed efficiently with Turborepo and Bun.


## 🛠️ Tech Stack

-   **Monorepo**: Turborepo
-   **Package Manager**: Bun
-   **Backend**: Node.js, Express, Mongoose, Sentiment Library
-   **Database**: MongoDB
-   **Frontend (Web)**: Next.js 14, Tailwind CSS
-   **Frontend (Mobile)**: React Native, Expo, TypeScript


## Getting Started

Prerequisites:
-  [Bun](https://bun.sh/) installed and can be done via the command:

    For macOS and Linux
    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```
    For Windows
    ```powershell
    powershell -c "irm bun.sh/install.ps1 | iex"
    ```

-  [MongoDB](https://www.mongodb.com/) instance running
-  [Node.js](https://nodejs.org/) installed

Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/s0nprem0/diary
    cd diary
    ```
2. Install dependencies:
    ```bash
    bun install
    ```
3. Set up environment variables:
   1. Create a `.env` file in the root directory.
   2. Add the following variables:
      1. `MONGO_URI`: Your MongoDB connection string.
      2. `PORT`: Port number for the backend server (default: 3001).
4. Start the app:
    ```bash
    bun run dev
    ```

## 📱 Local-First Mobile Behavior

- **Offline-first writes**: The mobile app stores entries locally immediately using AsyncStorage, ensuring no data loss when offline.
- **Background sync**: On returning to the Home screen, the app attempts to sync unsynced entries to the API. New entries use `POST /entries`; edited entries use `PATCH /entries/:id` if a `remoteId` exists.
- **Conflict handling**: The API schema includes `updatedAt` timestamps. The simple strategy used is last-write-wins based on server updates; mobile keeps a `synced` flag per entry.
- **Endpoints**:
  `GET /entries` — list entries
  `POST /entries` — create entry from content, auto mood analysis
  `PATCH /entries/:id` — update content and re-analyze mood
