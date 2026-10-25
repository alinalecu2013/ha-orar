"""Constante pentru integrarea ORAR."""
from __future__ import annotations

DOMAIN = "orar"
VERSION = "1.2.0"

STORAGE_VERSION = 1

STATIC_URL = "/orar_static"
MEDIA_URL = "/orar_media"
MEDIA_DIR = "orar_media"

PANEL_URL = "orar"
PANEL_TITLE = "Orar"
PANEL_ICON = "mdi:timetable"

DAYS = ["mon", "tue", "wed", "thu", "fri"]
DAY_NAMES = {
    "mon": "Luni",
    "tue": "Marți",
    "wed": "Miercuri",
    "thu": "Joi",
    "fri": "Vineri",
}
DAY_ALIASES = {
    "mon": "mon", "luni": "mon", "1": "mon", "monday": "mon",
    "tue": "tue", "marti": "tue", "marți": "tue", "marţi": "tue", "2": "tue", "tuesday": "tue",
    "wed": "wed", "miercuri": "wed", "3": "wed", "wednesday": "wed",
    "thu": "thu", "joi": "thu", "4": "thu", "thursday": "thu",
    "fri": "fri", "vineri": "fri", "5": "fri", "friday": "fri",
}

MAX_SUBJECTS = 120
MAX_SLOTS = 14
MAX_HOLIDAYS = 60
MAX_UPLOAD_BYTES = 12 * 1024 * 1024
ALLOWED_IMAGE_EXT = {"jpg", "jpeg", "png", "webp", "gif"}

EVENT_LESSON_START = "orar_lesson_start"
EVENT_LESSON_END = "orar_lesson_end"


def signal_data(entry_id: str) -> str:
    """Semnal trimis când datele (orar, materii, aspect) se schimbă."""
    return f"{DOMAIN}_data_{entry_id}"


def signal_state(entry_id: str) -> str:
    """Semnal trimis când starea calculată (ora curentă etc.) se schimbă."""
    return f"{DOMAIN}_state_{entry_id}"
