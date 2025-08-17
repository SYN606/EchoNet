from flask import Blueprint, request, redirect, url_for, jsonify
from datetime import datetime, timezone
import json
from services.device_service import devices, update_device, create_device_entry
from services.log_service import save_and_print_log, sanitize_hardware

logging_bp = Blueprint("logging", __name__)


@logging_bp.route("/log-email", methods=["POST"])
def log_email():
    """Handles email + hardware logging from form POST."""
    email = request.form.get("email")
    hardware_raw = request.form.get("hardware")

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    user_agent = request.headers.get("User-Agent")

    try:
        hardware = json.loads(hardware_raw) if hardware_raw else {}
    except json.JSONDecodeError as e:
        hardware = {"error": f"Invalid hardware JSON: {str(e)}"}

    log_entry = create_device_entry(uuid=hardware.get("uuid"),
                                    email=email,
                                    ip=user_ip,
                                    user_agent=user_agent,
                                    hardware=sanitize_hardware(hardware))

    save_and_print_log(log_entry)
    return redirect(url_for("main.meeting"))


@logging_bp.route("/log-hardware", methods=["POST"])
def log_hardware():
    """Logs hardware info on page load via JS."""
    data = request.get_json(force=True, silent=True) or {}
    uuid = data.get("uuid")

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    user_agent = request.headers.get("User-Agent")

    log_entry = create_device_entry(uuid=uuid,
                                    ip=user_ip,
                                    user_agent=user_agent,
                                    hardware=sanitize_hardware(data))

    save_and_print_log(log_entry)
    return jsonify({"status": "ok"}), 200


@logging_bp.route("/submit-email", methods=["POST"])
def submit_email():
    """Updates an existing device entry with the provided email."""
    data = request.get_json(force=True, silent=True) or {}
    uuid = data.get("uuid")
    email = data.get("email")

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    user_agent = request.headers.get("User-Agent")

    if uuid and uuid in devices:
        log_entry = update_device(uuid, email)
    else:
        log_entry = create_device_entry(uuid=uuid,
                                        email=email,
                                        ip=user_ip,
                                        user_agent=user_agent,
                                        hardware={})

    save_and_print_log(log_entry)
    return jsonify({"status": "ok"}), 200
