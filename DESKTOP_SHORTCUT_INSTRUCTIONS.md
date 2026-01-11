# Desktop Shortcut Instructions for Inphinity Fee Calculator

This guide will help you create a desktop shortcut to easily launch the Inphinity Fee Calculator.

---

## Option 1: Using PowerShell Script (Recommended)

The project includes a PowerShell script that automatically starts the development server and opens your browser.

### Steps:

1. **Locate the script:**
   - Find `start-inphinity-calculator.ps1` in the project root directory
   - Full path: `c:\Users\User\CAN CODING MASTER ANTIGRAVITTY\Inphinity Fee Calcualtor Web\inphinity-fee-calculator-web\start-inphinity-calculator.ps1`

2. **Test the script:**
   - Right-click `start-inphinity-calculator.ps1`
   - Select "Run with PowerShell"
   - The calculator should open in your browser at http://localhost:8080

3. **Create Desktop Shortcut:**

   **Method A: Drag and Drop (Easiest)**
   - Hold the **Right Mouse Button** and drag `start-inphinity-calculator.ps1` to your desktop
   - Release and select "Create shortcuts here"

   **Method B: Manual Creation**
   - Right-click on your Desktop
   - Select "New" → "Shortcut"
   - In the location field, paste:
     ```
     powershell.exe -ExecutionPolicy Bypass -File "c:\Users\User\CAN CODING MASTER ANTIGRAVITTY\Inphinity Fee Calcualtor Web\inphinity-fee-calculator-web\start-inphinity-calculator.ps1"
     ```
   - Click "Next"
   - Name it: `Inphinity Fee Calculator`
   - Click "Finish"

4. **Customize the Shortcut Icon (Optional):**
   - Right-click the shortcut → "Properties"
   - Click "Change Icon"
   - You can browse for an icon or use the default PowerShell icon

5. **Usage:**
   - Double-click the shortcut
   - Wait for the server to start (takes 5-10 seconds)
   - The calculator will open automatically in your default browser
   - **To stop the server:** Close the PowerShell window or press Ctrl+C

---

## Option 2: Using a Batch File

If you prefer a .bat file instead:

### Steps:

1. **Create a new file** on your desktop named `Start Inphinity Calculator.bat`

2. **Edit the file** and paste this content:
   ```batch
   @echo off
   cd /d "c:\Users\User\CAN CODING MASTER ANTIGRAVITTY\Inphinity Fee Calcualtor Web\inphinity-fee-calculator-web"
   echo Starting Inphinity Fee Calculator...
   echo.
   echo The calculator will open in your browser shortly.
   echo Press Ctrl+C to stop the server when you're done.
   echo.
   start http://localhost:8080
   npm run dev
   ```

3. **Save and close** the file

4. **Double-click** the batch file to test it

---

## Option 3: Browser Bookmark

For quick access if the server is already running:

1. Start the server manually: `npm run dev`
2. Open your browser to http://localhost:8080
3. Bookmark the page (Ctrl+D)
4. Name it "Inphinity Fee Calculator"

**Note:** You'll need to start the server manually each time before using the bookmark.

---

## Troubleshooting

### "PowerShell script won't run"
- **Solution:** Windows may block unsigned scripts by default
- Right-click the script → "Properties"
- At the bottom, check "Unblock" if present
- Click "Apply" and "OK"

### "npm is not recognized"
- **Solution:** Node.js is not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Restart your computer after installation

### "Port 8080 is already in use"
- **Solution:** Another application is using port 8080
- Close other instances of the calculator
- Or edit `vite.config.ts` to change the port number

### "Server fails to start"
- **Solution:** Dependencies may not be installed
- Open PowerShell in the project folder
- Run: `npm install`
- Try launching again

---

## Quick Reference

**Project Location:**
```
c:\Users\User\CAN CODING MASTER ANTIGRAVITTY\Inphinity Fee Calcualtor Web\inphinity-fee-calculator-web
```

**PowerShell Script:**
```
start-inphinity-calculator.ps1
```

**Calculator URL:**
```
http://localhost:8080
```

**Stop Server:**
- Close the PowerShell/Command window, OR
- Press Ctrl+C in the terminal

---

## What Happens When You Launch

1. ✅ PowerShell opens and navigates to the project directory
2. ✅ Checks if Node.js is installed
3. ✅ Checks if dependencies are installed (installs if needed on first run)
4. ✅ Starts the Vite development server
5. ✅ Waits for server to be ready (usually 5-10 seconds)
6. ✅ Automatically opens http://localhost:8080 in your default browser
7. ✅ Displays server logs in the PowerShell window

**The window must stay open** while you're using the calculator. Closing it will stop the server.

---

## File Created
Date: January 11, 2026
Version: 1.0
