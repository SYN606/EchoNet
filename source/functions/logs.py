import os
import json
from datetime import datetime, timezone

OUTPUT_DIR = "../output"
os.makedirs(OUTPUT_DIR, exist_ok=True)
LOG_FILE = os.path.join(OUTPUT_DIR, "captured_logs.json")
TXT_LOG_FILE = os.path.join(OUTPUT_DIR, "captured_logs.txt")


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


def _write_txt_logs(logs: dict):
    """Rewrite the TXT file so each UUID only has one block (latest state)."""
    try:
        with open(TXT_LOG_FILE, "w", encoding="utf-8") as f:
            for entry in logs.values():
                f.write("==== New Log Entry ====\n")
                f.write(f"Timestamp : {entry.get('timestamp')}\n")
                f.write(f"UUID      : {entry.get('uuid')}\n")
                f.write(f"Email     : {entry.get('email')}\n")
                f.write(f"IP        : {entry.get('ip')}\n")
                f.write(f"UserAgent : {entry.get('user_agent')}\n")

                hw = entry.get("hardware", {})
                if hw:
                    f.write("--- Hardware Info ---\n")
                    for k, v in hw.items():
                        f.write(f"{k}: {v}\n")

                f.write("\n")
    except Exception as e:
        print(f"[ERROR] Could not write TXT logs: {e}")


def _sanitize_entry(entry: dict) -> dict:
    """Clean up log entry before saving."""
    entry = entry.copy()

    if "timestamp" not in entry:
        entry["timestamp"] = datetime.now(timezone.utc).isoformat()

    hw = entry.get("hardware", {})
    if isinstance(hw, dict):
        hw.pop("uuid", None)
        hw.pop("user_agent", None)
        entry["hardware"] = hw

    return entry


def save_log_to_file(log_entry: dict):
    """
    Save or update a log entry:
    - JSON keeps only the latest state per UUID
    - TXT is rebuilt from JSON (so no duplicates)
    """
    try:
        uuid = log_entry.get("uuid")
        if not uuid:
            uuid = log_entry.get("email") or f"no-uuid-{datetime.now(timezone.utc).timestamp()}"
            log_entry["uuid"] = uuid

        log_entry = _sanitize_entry(log_entry)

        logs = _load_all_logs()
        logs[uuid] = log_entry
        _save_all_logs(logs)

        _write_txt_logs(logs)

    except Exception as e:
        print(f"[ERROR] Could not save log: {e}")
