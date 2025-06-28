# 🏏 Cricket Scoring App

A full-stack real-time cricket scoring application built using modern technologies like Next.js, NestJS, MongoDB, and Socket.IO.

## 🚀 Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | Next.js (App Router, React) |
| Backend    | NestJS (TypeScript)         |
| Database   | MongoDB Atlas               |
| Realtime   | Socket.IO                   |

---

## 📁 Project Structure

cricket-scoring-app/
├── backend/ # NestJS backend with MongoDB and WebSocket APIs
└── frontend/ # Next.js frontend with real-time updates


---

## ✨ Features

- Start a new cricket match
- Assign 4-digit unique match IDs
- Add ball-by-ball commentary
- Real-time updates using WebSockets
- Viewer count & live commentary feed

---

## 🛠️ Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/cricket-scoring-app.git
cd cricket-scoring-app

cd backend
npm install

npm run start:nodemon

cd ../frontend
npm install
npm run dev

