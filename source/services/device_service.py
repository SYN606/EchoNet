from datetime import datetime, timezone

# In-memory cache
devices = {}


def create_device_entry(uuid,
                        email=None,
                        ip=None,
                        user_agent=None,
                        hardware=None):
    entry = {
        "uuid": uuid,
        "email": email,
        "ip": ip,
        "user_agent": user_agent,
        "hardware": hardware or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    if uuid:
        devices[uuid] = entry
    return entry


def update_device(uuid, email):
    devices[uuid]["email"] = email
    devices[uuid]["timestamp"] = datetime.now(timezone.utc).isoformat()
    return devices[uuid]
