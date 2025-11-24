from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Store current trip data in memory
current_state = {
    "speed": 0.0,
    "distance": 0.0,
    "latitude": 0.0,
    "longitude": 0.0,
    "timestamp": None,
    "is_moving": False,
    "trip_start_time": None
}

# Store trip history
trip_path = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data', methods=['POST'])
def receive_data():
    global current_state
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Initialize trip start time on first data
    if current_state["trip_start_time"] is None:
        current_state["trip_start_time"] = datetime.now().isoformat()

    # Update speed/distance from ESP32
    if "speed" in data:
        current_state["speed"] = float(data["speed"])
    if "distance" in data:
        current_state["distance"] = float(data["distance"])
    
    current_state["timestamp"] = datetime.now().isoformat()
    current_state["is_moving"] = current_state["speed"] > 0
    
    return jsonify({"status": "success"}), 200

@app.route('/api/location', methods=['POST'])
def receive_location():
    global current_state, trip_path
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400

    lat = data.get("latitude")
    lon = data.get("longitude")
    
    if lat is not None and lon is not None:
        current_state["latitude"] = float(lat)
        current_state["longitude"] = float(lon)
        
        # Add to path
        trip_path.append({
            "lat": current_state["latitude"],
            "lng": current_state["longitude"],
            "speed": current_state["speed"],
            "time": datetime.now().isoformat()
        })

    return jsonify({"status": "success"}), 200

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "current": current_state,
        "path": trip_path
    })

@app.route('/api/reset', methods=['POST'])
def reset_trip():
    global current_state, trip_path
    current_state["distance"] = 0.0
    current_state["trip_start_time"] = datetime.now().isoformat()
    trip_path = []
    return jsonify({"status": "reset"}), 200

if __name__ == '__main__':
    # Use adhoc SSL context to generate self-signed certs on the fly
    # This allows HTTPS (required for Geolocation on mobile/LAN)
    print("Starting server on https://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True, ssl_context='adhoc')
