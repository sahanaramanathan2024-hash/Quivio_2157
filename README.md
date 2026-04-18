# 🚀 Quivio – AI-Assisted Quiz Generation Platform
## 📌 Overview

Quivio is an AI-assisted web platform designed to generate, evaluate, and manage quizzes intelligently. Unlike traditional static quiz systems, Quivio adapts to user inputs such as topic and difficulty level, providing dynamic question generation, automated evaluation, and meaningful feedback to enhance personalized learning.

## ❗ Problem Statement

Traditional learning platforms rely on static quizzes that do not adapt to individual learning needs. Educators face challenges in:

* Creating high-quality questions
* Evaluating descriptive answers
* Analyzing student performance efficiently

Quivio addresses these challenges by integrating AI-driven quiz generation and evaluation. 

## 💡 Motivation

This project was inspired by a hackathon problem statement focused on intelligent assessment systems. The idea was further developed into a full-fledged web application to solve real-world challenges in EdTech using modern web technologies and AI. 


## 🌐 Domain

**Web Technologies + EdTech (Educational Technology)**

Inspired by platforms like:

* Quizlet
* Kahoot


## ✨ Features

* 🧠 AI-based quiz generation
* 🎯 Customizable difficulty levels
* 📊 Automated evaluation & feedback
* 🔐 Secure authentication system
* ⚡ Responsive and interactive UI
* 📈 Scalable architecture


## 🏗️ System Architecture

Quivio follows a layered architecture:

### 1. Frontend Layer

* Built using React, HTML, CSS, JavaScript
* Handles user interaction (quiz creation, attempt, results)
* Sends requests via REST APIs

### 2. Validation Layer

* Input validation (client + server side)
* Authentication & session handling
* Prevents invalid/unauthorized requests

### 3. Backend Layer

* Built with Node.js and Express.js
* Handles API requests and business logic
* Connects frontend with AI and database

### 4. AI Processing Layer

* Generates quiz questions
* Evaluates responses
* Provides explanations and feedback

### 5. Database & Authentication

* Powered by Supabase (PostgreSQL)
* Stores users, quizzes, responses, results
* Handles secure login and access control

👉 The system flow (shown in your diagram on page 6) follows:
User → Frontend → Validation → Backend → AI + Database → Results 


## 🛠️ Tech Stack

* **Frontend:** React, HTML, CSS, JavaScript
* **Backend:** Node.js, Express.js
* **Database:** Supabase (PostgreSQL)
* **AI Integration:** Quiz generation & evaluation APIs


## ⚙️ Installation & Setup

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
npm start
```

---

## 🌐 Live Demo

👉 (https://quiz-genie--sahanaramanath1.replit.app/)

## 📸 Screenshots

<img width="1890" height="700" alt="image" src="https://github.com/user-attachments/assets/abb46a50-ac25-4968-8a9a-12160c048391" />


## 📚 Course Concepts Used

* Web Essentials (HTML, CSS)
* Client-side scripting (JavaScript, DOM)
* REST APIs & HTTP communication
* Node.js & Express backend
* React component-based architecture


## 🚀 Future Enhancements

* 📊 Performance analytics dashboard
* 🤖 Advanced AI personalization
* 👥 Role-based access (student/faculty)
* 📈 Learning progress tracking

