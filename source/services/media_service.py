import os
from datetime import datetime


def save_snapshot(email, file, base_dir):
    user_dir = os.path.join(base_dir, email)
    os.makedirs(user_dir, exist_ok=True)

    filename = f"snapshot_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.png"
    file_path = os.path.join(user_dir, filename)
    file.save(file_path)

    return file_path


def save_audio(email, file, base_dir):
    user_dir = os.path.join(base_dir, email)
    os.makedirs(user_dir, exist_ok=True)

    filename = f"audio_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.mp3"
    file_path = os.path.join(user_dir, filename)
    file.save(file_path)

    return file_path
