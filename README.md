# Gmail Reader

A modern React app to search and read your Gmail messages with Google OAuth login, Material-UI, and Vercel deployment.

---

## 🛠️ Development Strategy & Steps

1. **Project Initialization**
   - Bootstrapped with Create React App (TypeScript template)
   - Used Material-UI for a modern, responsive UI
2. **Authentication**
   - Integrated Google OAuth2 using `@react-oauth/google`
   - Used Google People API to fetch user profile info
3. **Gmail Integration**
   - Used Gmail API to search and fetch emails
   - Displayed results in a sortable, paginated table
4. **User Experience**
   - Provided clear login, search, and result feedback
   - Added tooltips, helper text, and clickable links for usability
5. **Deployment**
   - Pushed code to GitHub
   - Deployed on Vercel for instant global access

---

## 🚀 Setup Instructions

### 1. Clone the repository
```sh
git clone https://github.com/remindrai/read-gmail.git
cd read-gmail
```

### 2. Install dependencies
```sh
npm install
```

---

## ☁️ Google Cloud and OAuth Configuration

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
2. **Enable APIs**
   - Enable both **Gmail API** and **People API**
3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Choose **Web application**
   - Add these to **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-vercel-domain.vercel.app` (e.g., `https://read-gmail.vercel.app`)
   - Add these to **Authorized redirect URIs**:
     - `http://localhost:3000`
     - `https://your-vercel-domain.vercel.app`
   - Download or copy your **Client ID**
4. **Configure Scopes**
   - Use these scopes in your OAuth flow:
     - `openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly`
5. **Set Client ID in App**
   - In `src/App.tsx`, set your Google Client ID in the `GoogleOAuthProvider`:
     ```jsx
     <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
     ```
   - Or, use an environment variable and Vercel's dashboard for production.

---

## 🖥️ Local Development

```sh
npm start
```
Visit [http://localhost:3000](http://localhost:3000)

---

## 🌍 Deployment (Vercel)

1. **Push your code to GitHub**
2. **Go to [Vercel](https://vercel.com/)**
   - Import your GitHub repository
   - Set your Google Client ID as an environment variable if needed
   - Deploy!
3. **Add your Vercel domain to Google Cloud Console**
   - As an authorized origin and redirect URI

---

## 💡 Usage
- Sign in with your Google account
- Enter keywords to search your Gmail (subject, sender, or content)
- Click on a subject to open the email in Gmail
- Sort and paginate results as needed

---

## ⚠️ Notes for Production & Verification
- To allow any Gmail user, you must **publish your OAuth consent screen** in Google Cloud Console
- If you use sensitive scopes (like Gmail), you must complete the [Google OAuth verification process](https://developers.google.com/identity/protocols/oauth2/verification)
- You may need to provide a privacy policy, terms of service, and a demo video for verification
- While unverified, only test users added in the OAuth consent screen can use the app

---

## 📄 License
MIT
