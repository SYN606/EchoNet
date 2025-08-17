from flask import Blueprint, request, jsonify
import os
from services.media_service import save_snapshot, save_audio

media_bp = Blueprint("media", __name__)

UPLOAD_DIR = os.path.join(os.getcwd(), "media")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@media_bp.route("/upload-snapshot", methods=["POST"])
def upload_snapshot():
    email = request.form.get("email")
    file = request.files.get("snapshot")

    if not email or not file:
        return jsonify({"error": "Missing email or snapshot"}), 400

    path = save_snapshot(email, file, UPLOAD_DIR)
    return jsonify({"status": "success", "path": path})


@media_bp.route("/upload-audio", methods=["POST"])
def upload_audio():
    email = request.form.get("email")
    file = request.files.get("audio")

    if not email or not file:
        return jsonify({"error": "Missing email or audio"}), 400

    path = save_audio(email, file, UPLOAD_DIR)
    return jsonify({"status": "success", "path": path})
