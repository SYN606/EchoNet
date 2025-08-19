import os
import json
from datetime import datetime, timezone

OUTPUT_DIR = "../output"
os.makedirs(OUTPUT_DIR, exist_ok=True)
LOG_FILE = os.path.join(OUTPUT_DIR, "captured_logs.json")
TXT_LOG_FILE = os.path.join(OUTPUT_DIR, "captured_logs.txt")


# ==========================================================
# Helpers for JSON persistence
# ==========================================================
def _load_all_logs() -> dict:
    """Load all logs from JSON file into a dict {uuid: entry}."""
    if not os.path.exists(LOG_FILE):
        return {}
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_all_logs(logs: dict):
    """Write the entire logs dict back to JSON file."""
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)


# ==========================================================
# Formatting utilities
# ==========================================================
def _format_section(title: str, data: dict) -> str:
    """Format a dictionary into a pretty key-value section."""
    if not data:
        return f"[{title}]\n  N/A\n"

    max_key_len = max(len(str(k)) for k in data.keys())
    lines = [f"[{title}]"]
    for k, v in data.items():
        key = str(k).ljust(max_key_len)
        val = str(v) if v is not None else "N/A"
        lines.append(f"  {key} : {val}")
    return "\n".join(lines) + "\n"


def _human_time(ts: str) -> str:
    """Convert ISO timestamp to human-readable UTC time."""
    try:
        return datetime.fromisoformat(ts).strftime("%Y-%m-%d %H:%M:%S UTC")
    except Exception:
        return ts or "N/A"


# ==========================================================
# TXT Logging (append mode)
# ==========================================================
def _write_txt_log_entry(entry: dict):
    """Append a single log entry to TXT file (keeps history)."""
    try:
        with open(TXT_LOG_FILE, "a", encoding="utf-8") as f:
            f.write("═══════════════════════════════════════════════\n")
            f.write("              New Log Entry\n")
            f.write("═══════════════════════════════════════════════\n")

            f.write(
                f"Timestamp : {_human_time(entry.get('timestamp'))}\n"  # type: ignore
            )
            f.write(f"UUID      : {entry.get('uuid','N/A')}\n")
            f.write(f"Email     : {entry.get('email','N/A')}\n")
            f.write(f"IP        : {entry.get('ip','N/A')}\n")
            f.write(f"UserAgent : {entry.get('user_agent','N/A')}\n\n")

            f.write(_format_section("Hardware Info", entry.get("hardware",
                                                               {})))
            f.write("\n")

            f.write(
                _format_section("IP Details (ipinfo.io)",
                                entry.get("ip_details", {})))
            f.write("\n\n")
    except Exception as e:
        print(f"[ERROR] Could not write TXT log entry: {e}")


# ==========================================================
# Entry Sanitization
# ==========================================================
def _sanitize_entry(entry: dict) -> dict:
    """Clean up log entry before saving."""
    entry = entry.copy()

    # Ensure timestamp
    if "timestamp" not in entry:
        entry["timestamp"] = datetime.now(timezone.utc).isoformat()

    # Clean hardware
    hw = entry.get("hardware", {})
    if isinstance(hw, dict):
        hw.pop("uuid", None)
        hw.pop("user_agent", None)
        entry["hardware"] = hw

    # Ensure ip_details is a dict
    if not isinstance(entry.get("ip_details"), dict):
        entry["ip_details"] = {}

    return entry


# ==========================================================
# Public API
# ==========================================================
def save_log_to_file(log_entry: dict):
    """
    Save or update a log entry:
    - JSON keeps only the latest state per UUID
    - TXT keeps history (append mode) unless merge mode is on
    """
    try:
        uuid = log_entry.get("uuid")
        if not uuid:
            uuid = log_entry.get(
                "email") or f"no-uuid-{datetime.now(timezone.utc).timestamp()}"
            log_entry["uuid"] = uuid

        # Clean & normalize entry
        log_entry = _sanitize_entry(log_entry)

        # Load existing logs
        logs = _load_all_logs()
        old_entry = logs.get(uuid, {})

        # Merge: keep newest fields but preserve old ones if missing
        merged_entry = {**old_entry, **log_entry}
        merged_entry["hardware"] = {
            **old_entry.get("hardware", {}),
            **log_entry.get("hardware", {})
        }
        merged_entry["ip_details"] = {
            **old_entry.get("ip_details", {}),
            **log_entry.get("ip_details", {})
        }

        # Update JSON log (latest state only)
        logs[uuid] = merged_entry
        _save_all_logs(logs)

        # Append to TXT only if this adds *new info*
        if merged_entry != old_entry:
            _write_txt_log_entry(merged_entry)

    except Exception as e:
        print(f"[ERROR] Could not save log: {e}")
