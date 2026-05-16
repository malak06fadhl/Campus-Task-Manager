
# Campus Task Manager

Campus Task Manager is a smart academic workload management web application developed to support university students in organizing their studies more effectively. The project was built to address a common problem faced by many students: handling multiple assignments, quizzes, projects, and deadlines at the same time without a clear system for prioritization and planning. Instead of relying on simple to-do lists, this application provides a more structured and student-centered environment where users can manage courses, create and track academic tasks, monitor workload patterns, and make better planning decisions.

The system combines core productivity features with intelligent support tools. Students can organize tasks by course, assign priorities and deadlines, and view their workload through visual elements such as dashboards and workload heatmaps. In addition, the project includes an AI-powered study support assistant integrated with Google Gemini API, allowing students to receive guidance when they feel overwhelmed, unsure where to start, or in need of help with prioritizing their academic responsibilities. This makes the application not only a task manager, but also a practical academic support tool.

From a technical perspective, the project was developed as a full-stack web application using HTML, CSS, and JavaScript for the frontend, with Node.js, Express.js, and SQLite for the backend and data management. Authentication is handled securely using JWT and bcrypt. Overall, Campus Task Manager aims to reduce academic stress, improve productivity, and provide students with a smarter and more interactive way to manage their university life.


## How to Run the Project

This project is a local web application that requires both the **frontend** and the **backend** to run correctly.  
To use the full system, including login, admin login, tasks, dashboard, and AI support, please follow the steps below carefully.

---

## 1. Prerequisites

Before running the project, make sure the following are installed on the computer:

- **Node.js**
- **npm** (usually comes with Node.js)
- A code editor such as **Visual Studio Code**
- A browser such as **Google Chrome** or **Microsoft Edge**
- A valid **Google Gemini API key** for the AI Assistant feature

---

## 2. Project Structure

The project contains:

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js + Express
- **Database**: SQLite (local database)
- **AI Integration**: Google Gemini API

The backend must be running first, otherwise the login, admin login, and other dynamic features will not work.

---

## 3. Install Backend Dependencies

Open the project folder in **Visual Studio Code**.

Then open the terminal and go to the backend folder:

```bash
cd backend
Install all required backend packages:

npm.cmd install

If npm works normally on your system, you may also use:

npm install

```


## Configure the Environment File

Inside the backend folder, create or open a file named:

.env

Add the following variables:

JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=3000
Explanation
JWT_SECRET is used for secure login sessions.
GEMINI_API_KEY is required for the AI Assistant feature.
PORT=3000 means the backend will run on port 3000.

## How to Get a Google Gemini API Key

The AI Assistant feature requires a valid Google Gemini API key.

Steps:
Go to Google AI Studio / Google API Key page
Sign in with your Google account
Create a new API key
Copy the generated key
Paste it into the .env file like this:
GEMINI_API_KEY=your_real_api_key_here
Important Notes
The AI Assistant will not work without a valid Gemini API key.
If the API key is invalid, expired, leaked, or disabled, the AI feature will return an error.
The rest of the system may still work, but AI Support will fail.


## Start the Backend

After installing dependencies and configuring the .env file, start the backend server:

npm.cmd start

If npm works normally on your system, you may also use:

npm start
Expected result

If the backend starts successfully, the terminal should show something similar to:

StudyBalance API running at http://localhost:3000
Health: GET http://localhost:3000/api/health
Register: POST http://localhost:3000/api/register
Login: POST http://localhost:3000/api/login
Important

Do not close the backend terminal while using the web application.
The backend must remain running in order for the system to function correctly.


## Run the Frontend

To run the frontend, open the project in Visual Studio Code.

Then open the file:

html/index.html

It is recommended to run the frontend using Live Server.

Steps:
Right-click index.html
Click Open with Live Server


## Login and Register

Once the frontend and backend are both running:

New users can click Register to create an account
Existing users can use Login
Admin users can use Admin Login
Important

If the backend is not running, the login pages will show an error such as:

Cannot reach the server. Make sure the backend is running on port 3000.



## Default Admin Account

For local development, the system may include a default admin account.

Example:

Email: admin@studybalance.com
Password: admin123

If admin login does not work, make sure:

the backend is running
the admin account exists in the local database
the correct email and password are used

## Full Startup Sequence

To run the whole project correctly, follow this sequence:

Step 1

Open terminal and go to backend:

cd backend
Step 2

Install dependencies:

npm.cmd install
Step 3

Prepare .env file:

JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_real_api_key_here
PORT=3000
Step 4

Start backend:

npm.cmd start
Step 5

Open browser and test backend:

http://localhost:3000/api/health
Step 6

Open frontend with Live Server:

html/index.html
Step 7

Use the system:

Register
Login
Admin login
Courses
Tasks
Dashboard
AI Support



## Important Note About Data

This project currently uses a local SQLite database.

This means:

data is stored locally on the current machine
accounts created on one laptop will not automatically appear on another laptop
admin accounts and student accounts depend on the local database file on that device

To make the same data available across multiple devices, the project would need to be deployed online with a shared hosted database