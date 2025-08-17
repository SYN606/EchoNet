from flask import Blueprint, render_template
import random

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    return render_template("entry.html")


@main_bp.route("/meeting")
def meeting():
    meeting_id = f"{random.randint(100,999)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}"
    return render_template("meeting.html", meeting_id=meeting_id)
