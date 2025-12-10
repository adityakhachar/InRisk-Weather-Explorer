# ☀️ InRisk Weather Explorer Dashboard

## Project Overview

This is a full-stack weather data management and visualization dashboard developed for the Full-Stack Assessment. The application is designed to allow users to **fetch daily historical weather data** for specific coordinates (via Open-Meteo), **store the raw JSON securely in AWS S3**, and **visualize** the key temperature metrics in an interactive chart.

The application adheres to a modern **Monorepo** structure, cleanly separating the presentation layer (Frontend) from the data and business logic (Backend).

---

### 🔗 Live Demo & API Endpoints

| Component | Status | URL |
| :--- | :--- | :--- |
| **Frontend Dashboard (Vercel)** | Deployed | `[INSERT VERCEL DEPLOYMENT URL HERE]` |
| **Backend API (Render)** | Deployed | `[INSERT RENDER DEPLOYMENT URL HERE]` |

---


## 🛠️ Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | **Next.js** (React) | Modern framework for performance, routing, and Vercel optimization. |
| **Styling** | **Tailwind CSS** | Utility-first approach for rapid, modular, and responsive UI design. |
| **Data Visualization** | **Recharts** | Declarative charting library for React. |
| **Backend** | **FastAPI** (Python) | High-performance, asynchronous Python web framework for API endpoints. |
| **HTTP Client** | **httpx** | Async HTTP client used for fetching external weather data. |
| **Data Storage** | **AWS S3** / **boto3** | Secure, scalable cloud object storage for raw JSON weather data. |
| **Deployment** | **Vercel** & **Render** | Dedicated, seamless hosting for the frontend and backend services. |


