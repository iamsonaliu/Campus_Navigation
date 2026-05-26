<div align="center">

# 🧭 CAMPUSNAV-AI

### _Intelligent Campus Navigation & NLP Chatbot System_

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.3-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.7+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

**A full-stack AI-powered navigation system built for Graphic Era Hill University, Dehradun.**  
Navigate indoor corridors, outdoor pathways, and ask the AI chatbot — all from a single, beautiful interface.

<br/>

[🚀 Quick Start](#-quick-start) •
[✨ Features](#-features) •
[🏗️ Architecture](#️-system-architecture) •
[📡 API Docs](#-api-reference) •
[🛠️ Setup Guide](#️-detailed-setup)

</div>

---

## 📸 Preview

| Home Page | Interactive Map | AI Chatbot |
|:---------:|:---------------:|:----------:|
| Premium dark-themed landing page with dynamic hero section | Real-time Leaflet map with BFS / Dijkstra path visualization | NLP-powered chatbot querying live MySQL database |

---

## ✨ Features

### 🗺️ Interactive Campus Map
- **Three Navigation Zones** — Deemed Campus (indoor), Hill Campus (indoor), and Outer Campus (outdoor hostels, gates, arenas)
- **Dual Pathfinding Algorithms** — Choose between **BFS** (fewest turns) or **Dijkstra** (shortest physical distance)
- **Real-Time Visualization** — Animated route rendering on OpenStreetMap tiles via Leaflet.js
- **Node Coordinate Overlays** — Every classroom, lab, hostel, and gate is geo-tagged with precise lat/lng coordinates
- **Step-by-Step Route Roadmap** — Turn-by-turn directions with distance and walking time estimates

### 🤖 AI Chatbot (NLP)
- **Natural Language Queries** — Ask questions like *"Where is LT 201?"* or *"How to reach Lab 8?"*
- **Live Database Lookup** — Parses room codes via regex and fetches real-time records from the `classroom_locations` table
- **Smart Room Matching** — Supports abbreviations (`LT`, `CR`, `LAB`, `AUD`) and full names (`Lecture Theatre`, `Laboratory`)
- **Contextual Responses** — Returns building wing, floor number, and room descriptions

### 🎨 Premium UI/UX
- **Modern React + Vite Frontend** — Component-based SPA with fast HMR
- **Dark / Light Theme Toggle** — Persisted via `localStorage`
- **Micro-Animations** — Smooth transitions, glassmorphism cards, gradient overlays
- **Fully Responsive** — Optimized for desktop, tablet, and mobile viewports

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│   React 19 + Vite 8 (Port 5173)                                 │
│   ┌──────────┬──────────────┬────────────────┬───────────────┐  │
│   │  Navbar  │     Hero     │   MapViewer    │ ChatbotViewer │  │
│   │          │  QuickAccess │   (Leaflet)    │               │  │
│   │          │  Highlights  │                │               │  │
│   │          │  MapCallout  │                │               │  │
│   │          │   Footer     │                │               │  │
│   └──────────┴──────────────┴───────┬────────┴───────┬───────┘  │
│                                     │                │          │
└─────────────────────────────────────┼────────────────┼──────────┘
                                      │ REST API       │ REST API
                                      ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SPRING BOOT BACKEND (Port 8081)                │
│                                                                 │
│   NavigationController          ChatbotController               │
│   ├─ GET  /api/nodes            ├─ POST /api/chatbot/query      │
│   ├─ GET  /api/navigate         ├─ GET  /api/chatbot/rooms      │
│   └─ POST /api/node-details     └─ GET  /api/chatbot/health     │
│          │                               │                      │
│          ▼                               │ HTTP Proxy           │
│   GraphService                           ▼                      │
│   ├─ BFS Algorithm              ┌─────────────────────┐         │
│   └─ Dijkstra Algorithm         │  Flask API (Py:5000)│         │
│          │                      │  NLP Query Parser   │         │
│          ▼                      │  Regex Room Matcher │         │
│   DatabaseAccess (JDBC)         └─────────┬───────────┘         │
│          │                                │                     │
└──────────┼────────────────────────────────┼─────────────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database (Port 3306)                   │
│                   Database: campus_navigation                   │
│                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────┐         │
│   │ nodes_deemed │  │ nodes_hill   │  │ nodes_outer   │         │
│   │ edges_deemed │  │ edges_hill   │  │ edges_outer   │         │
│   └──────────────┘  └──────────────┘  └───────────────┘         │
│                                                                 │
│   ┌──────────────────────┐                                      │
│   │ classroom_locations  │  ← Chatbot queries this table        │
│   └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Reference

### Navigation Endpoints

| Method | Endpoint | Params | Description |
|:------:|:---------|:-------|:------------|
| `GET` | `/api/nodes` | `campus` (deemed / hill / outer) | Fetch all location names for a campus zone |
| `GET` | `/api/navigate` | `from`, `to`, `algorithm` (bfs / dijkstra), `campus` | Calculate shortest path between two locations |
| `POST` | `/api/node-details` | `campus` + JSON body `["Node1", "Node2"]` | Get lat/lng coordinates for specific nodes |

### Chatbot Endpoints

| Method | Endpoint | Description |
|:------:|:---------|:------------|
| `POST` | `/api/chatbot/query` | Send a natural language query (JSON: `{"query": "Where is LT 201?"}`) |
| `GET` | `/api/chatbot/rooms` | List all rooms in the `classroom_locations` table |
| `GET` | `/api/chatbot/health` | Health check for the chatbot service |

<details>
<summary><b>Example: Navigate between two locations</b></summary>

```bash
curl "http://localhost:8081/api/navigate?from=Gate+No.+1&to=Computer+Centre&algorithm=dijkstra&campus=hill"
```

**Response:**
```json
["Gate No. 1", "Main Road Junction", "Library Block", "Computer Centre"]
```

</details>

<details>
<summary><b>Example: Ask the Chatbot</b></summary>

```bash
curl -X POST http://localhost:8081/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Where is LT 201?"}'
```

**Response:**
```json
{
  "success": true,
  "response": "Lecture Theatre 201 is at second floor east wing of the building.",
  "room_data": {
    "room_code": "LT 201",
    "room_name": "Lecture Theatre 201",
    "building": "East",
    "floor": 2,
    "description": "Large lecture hall with projector and 120 seats."
  },
  "confidence": 0.95
}
```

</details>

---

## 🚀 Quick Start

### Prerequisites

| Software | Version | Purpose |
|:---------|:--------|:--------|
| [Java JDK](https://adoptium.net/) | 17+ | Spring Boot backend runtime |
| [Python](https://www.python.org/downloads/) | 3.7+ | Flask chatbot API |
| [XAMPP](https://www.apachefriends.org/) | Latest | MySQL database server |
| [Node.js](https://nodejs.org/) | 18+ | React frontend dev server |
| [Git](https://git-scm.com/) | Latest | Version control |

### 🔧 Installation

```bash
# 1. Clone the repository
git clone https://github.com/iamsonaliu/Campus_Navigation.git
cd Campus_Navigation

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Install frontend dependencies
cd frontend
npm install
cd ..
```

### 🗄️ Database Setup

1. **Start XAMPP** → Launch **Apache** and **MySQL** services
2. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Create a new database named **`campus_navigation`**
4. Import the SQL files to populate graph data:
   - Import all `nodes_*.sql` and `edges_*.sql` files (if available in the repo)
   - Run `database_setup.sql` for the chatbot's `classroom_locations` table
5. Alternatively, run the automated setup:
   ```bash
   python setup_chatbot.py
   ```

### ▶️ Running the Application

You need **three terminal windows** running simultaneously:

```bash
# Terminal 1: Start the Spring Boot backend (port 8081)
.\mvnw.cmd spring-boot:run

# Terminal 2: Start the Python chatbot API (port 5000)
python chatbot_api.py

# Terminal 3: Start the React frontend dev server (port 5173)
cd frontend
npm run dev
```

### 🌐 Access Points

| Service | URL |
|:--------|:----|
| **React Frontend** | [http://localhost:5173](http://localhost:5173) |
| **Spring Boot API** | [http://localhost:8081](http://localhost:8081) |
| **Flask Chatbot API** | [http://localhost:5000](http://localhost:5000) |
| **phpMyAdmin** | [http://localhost/phpmyadmin](http://localhost/phpmyadmin) |

---

## 📂 Project Structure

```
Campus_Navigation/
├── frontend/                          # React + Vite Frontend
│   ├── public/
│   │   └── images/icons/              # Campus images
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top navigation bar with theme toggle
│   │   │   ├── Hero.jsx               # Landing hero section
│   │   │   ├── QuickAccess.jsx        # Quick navigation cards
│   │   │   ├── Highlights.jsx         # News & features section
│   │   │   ├── MapCallout.jsx         # Territory showcase section
│   │   │   ├── MapViewer.jsx          # Leaflet map with pathfinding UI
│   │   │   ├── ChatbotViewer.jsx      # AI chatbot interface
│   │   │   └── Footer.jsx            # Footer with links & info
│   │   ├── App.jsx                    # Root app with tab routing
│   │   ├── index.css                  # Global design system & styles
│   │   └── main.jsx                   # React entry point
│   ├── package.json
│   └── vite.config.js                 # Vite config with API proxy
│
├── src/main/java/com/campusnavai/campus/
│   ├── CampusNavApplication.java      # Spring Boot entry point
│   ├── controller/
│   │   ├── NavigationController.java  # /api/nodes, /api/navigate, /api/node-details
│   │   └── ChatbotController.java     # Proxy to Flask chatbot API
│   ├── entity/
│   │   ├── Node.java                  # Node entity (id, name, lat, lng)
│   │   ├── Edge.java                  # Edge entity (from, to, weight)
│   │   └── WeightedEdge.java          # Weighted edge for Dijkstra
│   ├── repository/
│   │   └── DatabaseAccess.java        # JDBC data access layer
│   └── service/
│       └── GraphService.java          # BFS & Dijkstra implementations
│
├── src/main/resources/
│   ├── application.properties         # DB config, server port
│   └── static/                        # Legacy HTML/CSS/JS frontend
│
├── chatbot_api.py                     # Flask NLP chatbot server
├── setup_chatbot.py                   # Automated database & dependency setup
├── requirements.txt                   # Python dependencies
├── pom.xml                            # Maven build config (Spring Boot 3.2.3)
├── mvnw / mvnw.cmd                    # Maven wrapper scripts
└── README.md
```

---

## 🧠 Pathfinding Algorithms

### BFS (Breadth-First Search)
> Best for finding the path with the **fewest turns/intersections**.

Explores the graph level by level, guaranteeing the shortest path in terms of the number of edges traversed. Ideal when all corridors are roughly equal length.

### Dijkstra's Algorithm
> Best for finding the **shortest physical distance**.

Uses a priority queue to always expand the nearest unvisited node, considering actual edge weights (distances in meters). Returns the optimal walking path with minimum total distance.

```
Example: Gate No. 1 → Computer Centre

BFS Path:    Gate → Junction A → Block C → Computer Centre  (3 hops)
Dijkstra:    Gate → Junction A → Junction B → Block C → Computer Centre  (shorter distance, 4 hops)
```

---

## 🗃️ Database Schema

### Graph Tables (Navigation)

Each campus zone has its own pair of tables:

**`nodes_{campus}`** — Location vertices
| Column | Type | Description |
|:-------|:-----|:------------|
| `node_id` | INT (PK) | Unique node identifier |
| `name` | VARCHAR | Human-readable location name |
| `latitude` | DOUBLE | GPS latitude coordinate |
| `longitude` | DOUBLE | GPS longitude coordinate |

**`edges_{campus}`** — Weighted connections
| Column | Type | Description |
|:-------|:-----|:------------|
| `edge_id` | INT (PK) | Unique edge identifier |
| `from_node_id` | INT (FK) | Source node reference |
| `to_node_id` | INT (FK) | Destination node reference |
| `weight` | DOUBLE | Distance weight (meters) |

### Chatbot Table

**`classroom_locations`** — Room directory
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | INT (PK) | Auto-increment ID |
| `room_code` | VARCHAR | Room abbreviation (e.g., `LT 201`) |
| `room_name` | VARCHAR | Full room name |
| `building` | VARCHAR | Building wing (East/West/Main) |
| `floor` | INT | Floor number (-1 = basement, 0 = ground) |
| `description` | TEXT | Additional room info |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Frontend** | React 19, Vite 8, Leaflet.js | SPA with interactive maps |
| **Backend** | Java 17, Spring Boot 3.2.3, JDBC | REST API, graph algorithms, proxy |
| **Chatbot** | Python 3, Flask 2.3, Regex NLP | Natural language room lookup |
| **Database** | MySQL 8.0 (via XAMPP) | Nodes, edges, room directory |
| **Maps** | OpenStreetMap + Leaflet.js | Zero-cost geographic tile rendering |
| **Build** | Maven (Java), npm (JS), pip (Python) | Dependency management |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a **Pull Request**


---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ If you found this project helpful, give it a star!**

[![GitHub stars](https://img.shields.io/github/stars/iamsonaliu/Campus_Navigation?style=social)](https://github.com/iamsonaliu/Campus_Navigation)

</div>
