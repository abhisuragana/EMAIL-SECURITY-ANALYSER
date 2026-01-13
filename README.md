Email Threat Analyzer
A live web app that allows users to upload .eml or .msg email files and analyze sender authenticity, impersonation risks, and IP reputation using color-coded results. Built with React (frontend) and Motoko (backend on the Internet Computer).

Features
Upload .eml or .msg email files via browser
Analyze SPF, DKIM, and DMARC authentication results
Detect spoofing, impersonation, and anomalous sender behavior
Color-coded analysis report (Safe, Warning, Critical)
Runs Python logic seamlessly in the backend

Tech Stack

Frontend: React + TypeScript + TailwindCSS
Backend: Motoko (Internet Computer canister)
Deployment: Internet Computer (backend) + Vercel (frontend)

How to Run
Clone this repo.
Install dependencies: npm install (frontend), dfx start (backend).
Deploy frontend with Vercel or run locally: npm run dev.
License
MIT License © 2026 [Your Name]
