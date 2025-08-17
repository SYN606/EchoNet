from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime
import random
app = Flask(__name__)
captured_data = []


@app.route("/")
def index():
    return render_template("entry.html")


@app.route("/log-email", methods=["POST"])
def log_email():
    email = request.form.get("email")
    user_ip = request.remote_addr
    user_agent = request.headers.get("User-Agent")

    log_entry = {
        "email": email,
        "ip": user_ip,
        "user_agent": user_agent,
        "timestamp": datetime.utcnow().isoformat()
    }
    captured_data.append(log_entry)
    print("Captured:", log_entry)

    return redirect(url_for("meeting"))


@app.route("/meeting")
def meeting():
    meeting_id = f"{random.randint(100,999)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}"
    return render_template("meeting.html", meeting_id=meeting_id)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
