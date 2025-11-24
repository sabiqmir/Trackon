# Track-On Telemetry System

A premium, high-performance dashboard for your bike, powered by ESP32 and Flask.

## Features
- **"Track-On" Branding**: Neon Volt/Black aesthetic inspired by F1 telemetry.
- **OLED Dashboard**: Displays Speed, Distance, Time, and IP on the bike itself.
- **Live GPS Tracking**: Uses your phone's GPS (via secure HTTPS connection).
- **Real-time Stats**: Speedometer, Trip Distance, Max Speed.

## Project Structure
- `app.py`: Flask backend (Runs with HTTPS/SSL for Geolocation support).
- `templates/index.html`: The "Track-On" dashboard.
- `static/`: CSS and JS files.
- `esp32/firmware.ino`: C++ code for ESP32 + OLED.

## 1. Running the Web App (HTTPS Required)
We use HTTPS so your phone allows GPS access.
1. Install dependencies:
   ```bash
   pip install flask flask-cors pyopenssl
   ```
2. Run the server:
   ```bash
   python app.py
   ```
3. **Accessing the Dashboard**:
   - Open `https://<YOUR_PC_IP>:5000` on your phone/PC.
   - **WARNING**: Your browser will say "Your connection is not private" (because we generated a self-signed cert).
   - Click **Advanced -> Proceed to... (unsafe)**. This is normal for local development.
   - Allow Location Access when prompted.

## 2. Setting up the ESP32
1. **Hardware**:
   - ESP32 Board
   - A3144 Hall Sensor (Pin 14)
   - SSD1306 OLED Display (I2C: SDA=21, SCL=22 usually)
2. **Libraries**:
   - Install `Adafruit SSD1306` and `Adafruit GFX`.
   - Install `ArduinoJson`.
3. **Firmware Config**:
   - Update `ssid` / `password`.
   - Update `serverUrl`. 
     - **Note**: Since the server is now HTTPS, you might need to change `http` to `https` in the URL and uncomment `http.setInsecure()` in the code to skip cert validation on the ESP32 side. 
     - *Alternatively*, if you have trouble, you can run the Flask app in HTTP mode just for the ESP32 (requires running two ports) or just use `http.setInsecure()`.

## Wiring
- **Hall Sensor**: VCC (3.3V), GND, Signal (GPIO 14).
- **OLED**: VCC (3.3V), GND, SDA (GPIO 21), SCL (GPIO 22).
