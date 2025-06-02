from flask import Flask, request, send_from_directory
import datetime

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

# Optional logging endpoint (from JS frontend)
@app.route('/log', methods=['POST'])
def log_data():
    data = request.json
    ip = request.remote_addr
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    with open('logs.txt', 'a') as f:
        f.write(f"[{timestamp}] {ip} - {data}\n")

    return {'status': 'ok'}
