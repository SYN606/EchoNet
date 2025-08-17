from datetime import datetime, timezone
from functions.logs import save_log_to_file


def sanitize_hardware(hw: dict) -> dict:
    """Remove duplicate fields for clean hardware logs."""
    if not isinstance(hw, dict):
        return {}
    hw = hw.copy()
    hw.pop("uuid", None)
    hw.pop("user_agent", None)
    return hw


def save_and_print_log(log_entry: dict):
    """Persist log and print debug info."""
    if "timestamp" not in log_entry:
        log_entry["timestamp"] = datetime.now(timezone.utc).isoformat()
    save_log_to_file(log_entry)
    print("Captured:", log_entry)
