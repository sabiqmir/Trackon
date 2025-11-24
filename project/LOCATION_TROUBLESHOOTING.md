# Location Troubleshooting Guide

## The Issue
Geolocation requires HTTPS with a **trusted** certificate. Self-signed certificates often don't work for sensitive APIs like GPS.

## Solutions

### Option 1: Use on PC (Easiest)
1. On the PC running the server, open: `https://localhost:5000`
2. Accept the security warning
3. Allow location when prompted
4. Check browser console (F12) for GPS messages

### Option 2: Use on Mobile with ngrok (Recommended)
1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 5000`
3. You'll get a URL like: `https://abc123.ngrok.io`
4. Open that URL on your mobile
5. Allow location access

### Option 3: Manual Certificate Trust (Advanced)
For mobile devices to trust the self-signed cert:
1. Export the certificate from your browser
2. Install it on your mobile device
3. Mark it as trusted

## Debugging Steps
1. Open the web app
2. Press F12 (or inspect on mobile)
3. Go to Console tab
4. Look for messages like:
   - "Attempting to start GPS tracking..."
   - "Geolocation API is available"
   - "Initial GPS position acquired"
   
5. If you see "DENIED", check browser permissions:
   - Chrome: Settings → Privacy → Site Settings → Location
   - Firefox: Address bar → Lock icon → Permissions

## What the GPS Status Means
- **ACQUIRING**: Requesting location
- **LOCKED**: GPS working!
- **DENIED**: You blocked location access
- **TIMEOUT**: GPS took too long
- **UNAVAILABLE**: No GPS signal
- **INSECURE**: Not on HTTPS
- **NOT SUPPORTED**: Browser doesn't support GPS

## Current Server URLs
- PC: `https://localhost:5000`
- LAN: `https://192.168.1.6:5000`
