# Running Track-On on Termux (Android)

## Step-by-Step Guide

### 1. Install Termux
1. Download **Termux** from F-Droid (NOT Google Play - it's outdated)
   - Go to: https://f-droid.org/en/packages/com.termux/
   - Or search "Termux" in F-Droid app

### 2. Setup Termux Environment

Open Termux and run these commands:

```bash
# Update packages
pkg update && pkg upgrade

# Install Python
pkg install python

# Install git (to transfer files)
pkg install git

# Give Termux storage access (important!)
termux-setup-storage
```

### 3. Install Python Dependencies

```bash
# Install pip packages
pip install flask flask-cors pyopenssl
```

### 4. Transfer Your Project Files to Phone

#### Option A: Using Git (Recommended)
```bash
# In Termux
cd ~/storage/downloads
git clone <your-repo-url>
cd project
```

#### Option B: Manual Transfer
1. Copy the entire `project` folder to your phone's Downloads folder
2. In Termux:
```bash
cd ~/storage/downloads/project
ls  # Verify files are there
```

#### Option C: Create Files Directly in Termux
```bash
# Create project directory
mkdir ~/track-on
cd ~/track-on

# Create app.py
nano app.py
# Paste the app.py content, then Ctrl+X, Y, Enter

# Create directories
mkdir templates static
mkdir static/css static/js

# Create each file with nano
nano templates/index.html
nano static/css/style.css
nano static/js/script.js
```

### 5. Enable Mobile Hotspot

1. Go to phone Settings → Network & Internet → Hotspot & tethering
2. Turn on **Mobile Hotspot**
3. Note the **WiFi name** and **password**
4. Note the **hotspot IP** (usually `192.168.43.1` on Android)

### 6. Update ESP32 Firmware

Update these lines in your ESP32 code:
```cpp
const char* ssid = "YourPhoneHotspotName";
const char* password = "YourHotspotPassword";
const char* serverUrl = "https://192.168.43.1:5000/api/data";
```

Flash the updated code to ESP32.

### 7. Run the Server on Termux

```bash
# Navigate to project folder
cd ~/track-on  # or ~/storage/downloads/project

# Run the server
python app.py
```

You should see:
```
Starting server on https://0.0.0.0:5000
 * Running on https://127.0.0.1:5000
 * Running on https://192.168.43.1:5000
```

### 8. Access the Dashboard

1. **Keep Termux running** (don't close it)
2. Open **Chrome** or **Firefox** on your phone
3. Go to: `https://localhost:5000`
4. Click **Advanced** → **Proceed to localhost (unsafe)**
5. Allow **Location Access** when prompted
6. You should see the Track-On dashboard!

### 9. Connect ESP32

1. Power on your ESP32
2. It should connect to your phone's hotspot
3. Check the OLED display - it should show the IP address
4. Data should start appearing on the dashboard

---

## Troubleshooting

### "Command not found" errors
```bash
pkg update
pkg install python git
```

### "Permission denied" when accessing storage
```bash
termux-setup-storage
# Then allow storage permission in Android settings
```

### Server won't start
```bash
# Check if port 5000 is already in use
pkill python
python app.py
```

### ESP32 not connecting
- Make sure hotspot is ON
- Check WiFi name and password are correct
- Verify ESP32 is in range
- Check OLED display for error messages

### Location not working
- Use `https://localhost:5000` (not the IP address)
- Make sure you clicked "Allow" for location
- Check Chrome settings → Site settings → Location

### Keep Termux running in background
```bash
# Install Termux:Boot (from F-Droid)
# Or use this to prevent Termux from being killed:
termux-wake-lock
```

---

## Quick Reference Commands

```bash
# Start server
cd ~/track-on
python app.py

# Stop server
Ctrl + C

# Check if server is running
ps aux | grep python

# View server logs
# Just watch the Termux output

# Restart server
pkill python
python app.py
```

---

## Tips for Using While Biking

1. **Battery Saver:**
   - Lower screen brightness
   - Use battery saver mode
   - Consider a power bank

2. **Keep Termux Alive:**
   - Install **Termux:Boot** to auto-start
   - Use **termux-wake-lock** to prevent sleep
   - Pin Termux notification to prevent Android from killing it

3. **Screen On:**
   - Use "Keep screen on" in Developer Options
   - Or use an app like "Keep Screen On"

4. **Mounting:**
   - Use a phone mount on your bike
   - Keep phone in landscape mode for better view

---

## File Structure on Phone

```
/storage/emulated/0/
  └── Download/
      └── project/
          ├── app.py
          ├── templates/
          │   └── index.html
          └── static/
              ├── css/
              │   └── style.css
              └── js/
                  └── script.js
```

Or in Termux home:
```
~/track-on/
  ├── app.py
  ├── templates/
  │   └── index.html
  └── static/
      ├── css/
      │   └── style.css
      └── js/
          └── script.js
```

---

## Next Steps

1. Install Termux from F-Droid
2. Run the setup commands
3. Transfer project files
4. Enable mobile hotspot
5. Update ESP32 firmware
6. Run `python app.py` in Termux
7. Open `https://localhost:5000` in browser
8. Start tracking!

Need help with any specific step? Let me know!
