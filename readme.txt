🚀 Resume Analyzer — AI-Powered Resume Evaluation (Gemini 1.5 Flash)

A full-stack AI-driven system that analyzes resumes, extracts skills, evaluates ATS scores, generates summaries, identifies weaknesses, compares resumes with job descriptions, and produces tailored improvements — all powered by Google Gemini 1.5 Flash.

This project includes:

✔ Resume Analyzer
✔ ATS Score Calculator
✔ JD Matching
✔ Resume Rewriter
✔ Keyword Extractor
✔ Salary Estimator
✔ Role Recommendations
✔ Full REST API Backend
✔ Modern Frontend UI

📌 Features
🔍 Resume Analysis

Generates an overall score

ATS compatibility score

Strengths & weaknesses

Missing keywords

Professional summary

Salary estimate

Best-fit job roles

🧠 Job Description Matcher

Matches your resume against a job description

Computes JD match %

Extracts required vs missing skills

Generates improvements

✍️ Resume Rewriter

Enhances grammar, impact, ATS friendliness

Improves bullet points

🧩 Skills Extractor

Extracts technical + soft skills

Highlights missing skills

📄 Cover Letter Generator

Creates personalized cover letters instantly

🛠 Tech Stack
Frontend

React (Vite)

TailwindCSS

Axios

Backend

Node.js

Express.js

Axios

Gemini 1.5 Flash API

AI Model

Google Gemini 1.5 Flash

Fast, cheap, highly capable for structured text analysis

🚀 Installation Guide
1️⃣ Clone the Repository
git clone https://github.com/your-username/resume-analyzer.git
cd resume-analyzer

🖥 Backend Setup (Node + Express)
2️⃣ Install Server Dependencies
cd server
npm install

3️⃣ Configure Environment

Create:

server/.env


Add:

GEMINI_API_KEY=YOUR_KEY_HERE
PORT=5000


⚠ Ensure the key has no spaces, no extra characters, and no quotes.

4️⃣ Start Backend
node server.js


Backend runs on:

http://localhost:5000

🌐 Frontend Setup
5️⃣ Install Client Dependencies
cd ../client
npm install

6️⃣ Start Frontend
npm run dev


Frontend runs on:

http://localhost:5173

🔗 API Endpoints
POST /analyze

Analyze resume text
Request:

{
  "resume": "text_here"
}

POST /match

Match resume with job description
Request:

{
  "resume": "text_here",
  "job_description": "jd_here"
}

POST /rewrite

Rewrite resume professionally
Request:

{
  "resume": "text_here"
}

POST /skills

Extract skills
Request:

{
  "resume": "text_here"
}

📦 Project Structure
resume-analyzer/
│── client/             # React Frontend
│── server/             # Express Backend
│   ├── server.js
│   ├── gemini.js
│   └── .env
│── README.md
🧪 Testing Your Setup

After backend start, test Gemini connectivity:

curl -X POST http://localhost:5000/analyze \
-H "Content-Type: application/json" \
-d '{"resume":"senior python developer"}'


If your API key is correct, you'll receive structured JSON output.

🛡 Troubleshooting
❌ “Gemini API call failed: 400”

Fix:

Your payload format is wrong

You must use

{ "prompt": { "text": "your text" } }


Key may have whitespace → remove spaces/newlines

Restart server after editing .env

❌ undefined API Key

Rename .env.example → .env

Ensure:

GEMINI_API_KEY=AbCdEf123

❌ Empty response / analysis stuck

Restart backend

Ensure you are calling v1beta/generateContent

Use correct endpoint:

gemini-1.5-flash-latest:generateContent

🎯 Roadmap (Planned Enhancements)

PDF resume upload

Multi-model support (Gemini Pro / GPT-4 / Llama)

Chrome Extension

Auto-format Resume Builder

Chat-style career assistant

🤝 Contributing

Pull requests are welcome!
For major changes, open an issue first to discuss your idea.

📜 License

This project is licensed under the MIT License.

⭐ Support

If you find this helpful, consider giving the repository a star ★ on GitHub.