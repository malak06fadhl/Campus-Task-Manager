
# Campus Task Manager

Campus Task Manager is a web application built for students to manage academic workload more effectively.  
It allows users to organize courses, manage tasks, view workload visually, and receive AI-based academic support.
Campus Task Manager is the project concept and submission title. During development, I named the system StudyBalance as the working application name.
## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: SQLite
- Authentication: JWT, bcrypt
- AI Integration: Google Gemini API

## How to Run the App

### 1. Install backend dependencies
```bash
cd backend
npm install

## Configure environment variables

Create a .env file inside the backend folder and add:

JWT_SECRET=studybalance-dev-secret-change-in-production
GEMINI_API_KEY=AIzaSyAFqlYHXKEl-cFjMKoeUeClf6DuEWdqdrE
PORT=3000

##  Start the backend server
npm start
```

## The backend will run at:
http://localhost:3000

## Open the frontend
Open html/index.html in the browser, or use Live Server in VS Code.

## Project Approach

The project was planned as a student productivity system focused on academic task management.
The main goal was to create a lightweight but practical application that helps students manage deadlines, courses, and workload more clearly.

## Technical Decisions

The project uses a simple client-server structure.
HTML, CSS, and JavaScript were used for the frontend because they are lightweight and suitable for a fast development timeline.
Node.js and Express were used for backend logic and API handling, while SQLite was chosen for simple local data storage.
Google Gemini API was integrated to provide AI-based study support.

## Challenges Faced
