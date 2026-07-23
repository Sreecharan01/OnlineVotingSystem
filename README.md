<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=4F46E5&height=200&section=header&text=ElectVote&fontSize=80&fontAlignY=35&desc=Secure%20Online%20Voting%20System&descAlignY=55&descSize=20&animation=twinkling" />
</div>

<p align="center">
  <a href="https://readme-typing-svg.demolab.com?font=Inter&weight=800&size=24&pause=1000&color=4F46E5&center=true&vCenter=true&width=600&lines=Secure+Blockchain-Inspired+Voting;Real-time+Analytics+Dashboard;Glassmorphism+Modern+UI;Production-ready+Flask+%2B+MongoDB">
    <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=800&size=24&pause=1000&color=4F46E5&center=true&vCenter=true&width=600&lines=Secure+Blockchain-Inspired+Voting;Real-time+Analytics+Dashboard;Glassmorphism+Modern+UI;Production-ready+Flask+%2B+MongoDB" alt="Typing SVG" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-2.3+-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" />
  <img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge&logo=vercel" />
</p>

<hr>

<h2 align="center">✨ Features at a Glance</h2>

<table align="center">
  <tr>
    <td width="50%" valign="top">
      <h3>🔐 Robust Authentication</h3>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Locked.png" width="40" align="left" />
      <p>Secure login, CSRF protection, Werkzeug password hashing, and role-based access control (Voter vs Admin).</p>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Real-time Analytics</h3>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.png" width="40" align="left" />
      <p>Live vote tracking, participation rates, and interactive Chart.js graphs showing real-time election results.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🎨 Glassmorphism UI</h3>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Magic%20Wand.png" width="40" align="left" />
      <p>Stunning modern design with blur effects, dynamic Dark Mode, CSS animations, and responsive layout.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🛡️ Admin Dashboard</h3>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png" width="40" align="left" />
      <p>Comprehensive controls to manage elections, approve users, add candidates, and export CSV reports.</p>
    </td>
  </tr>
</table>

<br>

## 📸 Screenshots

> Add your animated GIFs or screenshots to the `screenshots/` folder to make this section pop!

---

## 🏗️ Project Architecture

```mermaid
graph TD
    A[Voter / Admin] -->|HTTPS Request| B(Flask App)
    B --> C{Routes}
    C -->|/auth| D[Auth Logic]
    C -->|/voter| E[Voter Dashboard]
    C -->|/admin| F[Admin Controls]
    D & E & F --> G[Database Handler]
    G <-->|PyMongo| H[(MongoDB Atlas)]
```

---

## 🚀 Installation & Setup

<details open>
<summary><b>1. Clone the Repository</b></summary>
<br>

```bash
git clone https://github.com/yourusername/OnlineVotingSystem.git
cd OnlineVotingSystem
```
</details>

<details>
<summary><b>2. Create Virtual Environment</b></summary>
<br>

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```
</details>

<details>
<summary><b>3. Install Dependencies & Setup Env</b></summary>
<br>

```bash
pip install -r requirements.txt
```

Create a `.env` file in the project root:
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/online_voting
SECRET_KEY=your-super-secret-key
FLASK_ENV=development
```
</details>

<details>
<summary><b>4. Run the Application</b></summary>
<br>

```bash
python app.py
```
The app will start at: **http://127.0.0.1:5000**
</details>

<br>

---

## 🌐 Deployment (Vercel)

This project is configured for one-click deployment on **Vercel** using Serverless Functions.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add `MONGO_URI` and `SECRET_KEY` in the Environment Variables.
4. Deploy! 🚀

---

## 🔒 Security Measures

*   <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Check%20Mark%20Button.png" width="20" /> **DB-Level Uniqueness:** Prevents duplicate voting via MongoDB unique indexes.
*   <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Check%20Mark%20Button.png" width="20" /> **Sanitization:** Strict input validation to prevent XSS and NoSQL injections.
*   <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Check%20Mark%20Button.png" width="20" /> **CSRF Protection:** Flask-WTF token integration on all forms.

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=4F46E5&height=100&section=footer" />
</div>
