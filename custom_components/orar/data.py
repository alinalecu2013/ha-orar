"""Model de date ORAR: valori implicite și validare (sanitizare)."""
from __future__ import annotations

from datetime import date
import re
from typing import Any
import uuid

from .const import DAYS, MAX_HOLIDAYS, MAX_SLOTS, MAX_SUBJECTS

TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
ICON_RE = re.compile(r"^[a-z0-9_-]+:[a-z0-9-]+$")

BG_PRESETS = ["galaxy", "ocean", "sunset", "forest", "chalkboard", "notebook", "candy", "aurora"]
FONTS = ["Bebas Neue", "Bangers", "Baloo 2", "Fredoka", "Patrick Hand", "Nunito", "system"]

DEFAULT_DAY_COLORS = {
    "mon": "#63c5ee",
    "tue": "#128b92",
    "wed": "#e2512f",
    "thu": "#f8ac3e",
    "fri": "#ee84ae",
}

# cheie: (tip, implicit, extra) – extra = (min, max) pentru numere, listă pentru enum
APPEARANCE_SPEC: dict[str, tuple[str, Any, Any]] = {
    "title": ("str", "ORAR", 60),
    "class_name": ("str", "", 40),
    "subtitle": ("str", "", 120),
    "footer": ("str", "Învățătura este o comoară care își urmează stăpânul pretutindeni ✨", 200),
    "bg_type": ("enum", "preset", ["preset", "image", "color"]),
    "bg_preset": ("enum", "galaxy", BG_PRESETS),
    "bg_image": ("str", "", 2000),
    "bg_color": ("color", "#101a4f", None),
    "bg_size": ("enum", "cover", ["cover", "contain", "tile"]),
    "bg_dim": ("num", 0.0, (0.0, 0.9)),
    "bg_blur": ("num", 0.0, (0.0, 20.0)),
    "stars": ("bool", True, None),
    "title_color": ("color", "#f6ae3b", None),
    "text_color": ("color", "#ffffff", None),
    "title_font": ("enum", "Bebas Neue", FONTS),
    "body_font": ("enum", "Baloo 2", FONTS),
    "layout": ("enum", "rows", ["rows", "timeline"]),
    "cell_style": ("enum", "stripe", ["stripe", "tinted", "solid"]),
    "cell_radius": ("num", 14.0, (0.0, 30.0)),
    "window_blur": ("num", 6.0, (0.0, 24.0)),
    "show_times": ("bool", True, None),
    "show_icons": ("bool", True, None),
    "show_room": ("bool", True, None),
    "show_teacher": ("bool", False, None),
    "show_dates": ("bool", True, None),
    "show_now": ("bool", True, None),
    "show_clock": ("bool", True, None),
    "show_footer": ("bool", True, None),
}


def _default_days() -> dict[str, dict[str, Any]]:
    return {
        day: {"color": color, "window": "#ffffff", "opacity": 0.94, "text": "#1d2340"}
        for day, color in DEFAULT_DAY_COLORS.items()
    }


def default_appearance() -> dict[str, Any]:
    appearance = {key: spec[1] for key, spec in APPEARANCE_SPEC.items()}
    appearance["days"] = _default_days()
    return appearance


def _subj(sid, name, short, color, icon, items="", teacher="", room=""):
    return {
        "id": sid, "name": name, "short": short, "color": color, "icon": icon,
        "teacher": teacher, "room": room, "items": items, "notes": "",
    }


def default_subjects() -> list[dict[str, Any]]:
    return [
        _subj("romana", "Limba și literatura română", "Română", "#e2512f", "mdi:book-open-page-variant", "manual, caiet, culegere"),
        _subj("mate", "Matematică", "Mate", "#3f7be0", "mdi:calculator-variant", "culegere, riglă, compas, echer"),
        _subj("engleza", "Limba engleză", "Engleză", "#c0392b", "mdi:alphabet-latin", "manual, dicționar"),
        _subj("franceza", "Limba franceză", "Franceză", "#2e86de", "mdi:translate", "manual, caiet"),
        _subj("istorie", "Istorie", "Istorie", "#8e5b3c", "mdi:castle", "manual, atlas istoric"),
        _subj("geografie", "Geografie", "Geografie", "#16a085", "mdi:earth", "atlas, manual"),
        _subj("biologie", "Biologie", "Biologie", "#27ae60", "mdi:leaf", "manual, caiet"),
        _subj("fizica", "Fizică", "Fizică", "#8e44ad", "mdi:atom", "culegere, calculator"),
        _subj("chimie", "Chimie", "Chimie", "#d35400", "mdi:flask", "tabel periodic, caiet"),
        _subj("informatica", "Informatică și TIC", "Info", "#0097a7", "mdi:laptop", "stick USB"),
        _subj("sport", "Educație fizică și sport", "Sport", "#f39c12", "mdi:run", "echipament sport, adidași, apă"),
        _subj("muzica", "Educație muzicală", "Muzică", "#e84393", "mdi:music", "flaut, caiet de muzică"),
        _subj("desen", "Educație plastică", "Desen", "#fd79a8", "mdi:palette", "acuarele, pensule, bloc de desen"),
        _subj("religie", "Religie", "Religie", "#b8860b", "mdi:church", ""),
        _subj("tehnologica", "Educație tehnologică", "Tehnologică", "#636e72", "mdi:tools", "trusă, foarfecă, lipici"),
        _subj("dirigentie", "Consiliere și dezvoltare personală", "Dirigenție", "#6c5ce7", "mdi:account-group", "carnet de elev"),
    ]


def default_periods() -> list[dict[str, str]]:
    return [
        {"start": f"{h:02d}:00", "end": f"{h:02d}:50"} for h in range(8, 14)
    ]


def _cells(*ids: str | None) -> list[dict[str, Any]]:
    return [{"subject": sid, "start": "", "end": "", "note": ""} for sid in ids]


def default_schedule() -> dict[str, list[dict[str, Any]]]:
    return {
        "mon": _cells("romana", "mate", "engleza", "istorie", "sport", "muzica"),
        "tue": _cells("mate", "romana", "biologie", "geografie", "franceza", "desen"),
        "wed": _cells("romana", "fizica", "mate", "engleza", "informatica", "dirigentie"),
        "thu": _cells("mate", "chimie", "romana", "sport", "religie", "tehnologica"),
        "fri": _cells("engleza", "mate", "romana", "biologie", "geografie", None),
    }


def default_data() -> dict[str, Any]:
    return {
        "subjects": default_subjects(),
        "periods": default_periods(),
        "schedule": default_schedule(),
        "appearance": default_appearance(),
        "holidays": [],
    }


# ---------------------------------------------------------------- sanitizare

def _str(value: Any, max_len: int = 200) -> str:
    if value is None:
        return ""
    return str(value)[:max_len]


def _color(value: Any, default: str) -> str:
    return value.lower() if isinstance(value, str) and COLOR_RE.match(value) else default


def _time(value: Any) -> str:
    return value if isinstance(value, str) and TIME_RE.match(value) else ""


def _num(value: Any, lo: float, hi: float, default: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if number != number:  # NaN
        return default
    return round(max(lo, min(hi, number)), 3)


def _bool(value: Any, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("1", "true", "on", "yes", "da")
    if isinstance(value, (int, float)):
        return bool(value)
    return default


def _date(value: Any) -> str:
    try:
        return date.fromisoformat(str(value)[:10]).isoformat()
    except ValueError:
        return ""


def sanitize_subjects(value: Any) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    seen: set[str] = set()
    if not isinstance(value, list):
        return result
    for raw in value[:MAX_SUBJECTS]:
        if not isinstance(raw, dict):
            continue
        sid = re.sub(r"[^a-zA-Z0-9_-]", "", _str(raw.get("id"), 40)) or uuid.uuid4().hex[:10]
        while sid in seen:
            sid = uuid.uuid4().hex[:10]
        seen.add(sid)
        icon = _str(raw.get("icon"), 80)
        result.append({
            "id": sid,
            "name": _str(raw.get("name"), 80) or "Materie",
            "short": _str(raw.get("short"), 24),
            "color": _color(raw.get("color"), "#3f7be0"),
            "icon": icon if ICON_RE.match(icon) else "",
            "teacher": _str(raw.get("teacher"), 80),
            "room": _str(raw.get("room"), 40),
            "items": _str(raw.get("items"), 500),
            "notes": _str(raw.get("notes"), 500),
        })
    return result


def sanitize_periods(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []
    return [
        {"start": _time(p.get("start")), "end": _time(p.get("end"))}
        for p in value[:MAX_SLOTS]
        if isinstance(p, dict)
    ]


def sanitize_schedule(value: Any, subject_ids: set[str]) -> dict[str, list[dict[str, Any]]]:
    value = value if isinstance(value, dict) else {}
    schedule: dict[str, list[dict[str, Any]]] = {}
    for day in DAYS:
        cells = value.get(day) if isinstance(value.get(day), list) else []
        clean = []
        for cell in cells[:MAX_SLOTS]:
            if not isinstance(cell, dict):
                cell = {}
            sid = cell.get("subject")
            clean.append({
                "subject": sid if isinstance(sid, str) and sid in subject_ids else None,
                "start": _time(cell.get("start")),
                "end": _time(cell.get("end")),
                "note": _str(cell.get("note"), 200),
            })
        schedule[day] = clean
    return schedule


def sanitize_appearance(value: Any) -> dict[str, Any]:
    value = value if isinstance(value, dict) else {}
    result: dict[str, Any] = {}
    for key, (kind, default, extra) in APPEARANCE_SPEC.items():
        raw = value.get(key, default)
        if kind == "str":
            result[key] = _str(raw, extra)
        elif kind == "enum":
            result[key] = raw if raw in extra else default
        elif kind == "color":
            result[key] = _color(raw, default)
        elif kind == "num":
            result[key] = _num(raw, extra[0], extra[1], default)
        elif kind == "bool":
            result[key] = _bool(raw, default)
    raw_days = value.get("days") if isinstance(value.get("days"), dict) else {}
    defaults = _default_days()
    result["days"] = {}
    for day in DAYS:
        raw = raw_days.get(day) if isinstance(raw_days.get(day), dict) else {}
        dflt = defaults[day]
        result["days"][day] = {
            "color": _color(raw.get("color"), dflt["color"]),
            "window": _color(raw.get("window"), dflt["window"]),
            "opacity": _num(raw.get("opacity", dflt["opacity"]), 0.0, 1.0, dflt["opacity"]),
            "text": _color(raw.get("text"), dflt["text"]),
        }
    return result


def sanitize_holidays(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []
    result = []
    for raw in value[:MAX_HOLIDAYS]:
        if not isinstance(raw, dict):
            continue
        start, end = _date(raw.get("start")), _date(raw.get("end"))
        if start and end and end < start:
            start, end = end, start
        result.append({"name": _str(raw.get("name"), 80) or "Vacanță", "start": start, "end": end or start})
    return result


def sanitize(data: Any) -> dict[str, Any]:
    """Returnează o copie completă și validă a datelor."""
    data = data if isinstance(data, dict) else {}
    subjects = sanitize_subjects(data.get("subjects", default_subjects()))
    return {
        "subjects": subjects,
        "periods": sanitize_periods(data.get("periods", default_periods())),
        "schedule": sanitize_schedule(data.get("schedule", {}), {s["id"] for s in subjects}),
        "appearance": sanitize_appearance(data.get("appearance", {})),
        "holidays": sanitize_holidays(data.get("holidays", [])),
    }
