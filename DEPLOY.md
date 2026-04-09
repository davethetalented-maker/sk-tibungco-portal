# SK Tibungco Deployment Guide

## Step 1: Create GitHub Account
1. Go to https://github.com/signup
2. Sign up with your email (use any email)
3. Verify your email

## Step 2: Create Your First Repository
1. Click your profile icon (top right) → "Your repositories"
2. Click green "New" button
3. Repository name: `sk-tibungco-portal`
4. Description: `SK Tibungco Digital Portal`
5. Make it PUBLIC
6. Click "Create repository"
7. GitHub shows you instructions - COPY the repository URL (looks like: https://github.com/YOUR_USERNAME/sk-tibungco-portal.git)

## Step 3: Upload Files to GitHub
1. On your GitHub repo page, click "Add file" → "Upload files"
2. Open File Explorer → Navigate to: C:\Users\DAVEDAGNIPA\Dropbox\PC\Downloads\SK TIBUNGCO
3. Select ALL files (Ctrl+A) and drag them to GitHub
4. Scroll down and click green "Commit changes" button

## Step 4: Deploy to Render (Free Hosting)
1. Go to https://render.com/signup
2. Click "Sign up with GitHub"
3. Authorize Render to access GitHub
4. On Render dashboard, click "New" → "Web Service"
5. Find and select your repo: `sk-tibungco-portal`
6. Configure:
   - Name: `sk-tibungco-portal`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
7. Click "Create Web Service"
8. Wait 2-3 minutes for deployment
9. Copy the URL from top (looks like: https://sk-tibungco-portal.onrender.com)

## Step 5: Test Your Link
Send this link to anyone: https://sk-tibungco-portal.onrender.com
They can now:
- Submit document requests
- Register as youth
- File complaints
- Track requests

## Step 6: Set Up Email (Optional)
If you want email confirmations:
1. Go to your Render service
2. Click "Environment" tab
3. Add these variables:
   - SMTP_HOST: `smtp.gmail.com`
   - SMTP_PORT: `587`
   - SMTP_USER: your@gmail.com
   - SMTP_PASS: (Gmail app password - see: https://support.google.com/accounts/answer/185833)
   - EMAIL_FROM: "SK Tibungco" <your@gmail.com>
4. Click "Save"

That's it! Your portal is now online.
