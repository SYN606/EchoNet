import os
import uuid
from datetime import datetime, timezone
from werkzeug.utils import secure_filename


def _sanitize_email(email: str) -> str:
    """Turn email into a safe directory name."""
    return secure_filename(email.replace("@", "_at_"))


def _unique_filename(prefix: str, ext: str) -> str:
    """Generate unique filename with timestamp + UUID fragment."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    uid = uuid.uuid4().hex[:8]
    return f"{prefix}_{timestamp}_{uid}{ext}"


def save_snapshot(email, file, base_dir):
    """Save snapshot image safely."""
    safe_email = _sanitize_email(email)
    user_dir = os.path.join(base_dir, "snapshots", safe_email)
    os.makedirs(user_dir, exist_ok=True)

    ext = ".png"  # default
    if file.mimetype and "jpeg" in file.mimetype:
        ext = ".jpg"

    filename = _unique_filename("snapshot", ext)
    file_path = os.path.join(user_dir, filename)
    file.save(file_path)

    return file_path


def save_audio(email, file, base_dir):
    """Save audio recording safely."""
    safe_email = _sanitize_email(email)
    user_dir = os.path.join(base_dir, "audio", safe_email)
    os.makedirs(user_dir, exist_ok=True)

    ext = ".webm"  # default (since browser often sends webm)
    if file.mimetype == "audio/mpeg":
        ext = ".mp3"
    elif file.mimetype == "audio/wav":
        ext = ".wav"

    filename = _unique_filename("audio", ext)
    file_path = os.path.join(user_dir, filename)
    file.save(file_path)

    return file_path
