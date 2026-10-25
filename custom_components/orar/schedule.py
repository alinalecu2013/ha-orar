"""Calcule pe orar: ora curentă, următoarea oră, ghiozdanul de mâine."""
from __future__ import annotations

from datetime import date, datetime, timedelta
import re
from typing import Any

from homeassistant.util import dt as dt_util

from .const import DAY_NAMES, DAYS
from .data import TIME_RE


def to_min(value: str) -> int | None:
    if isinstance(value, str) and TIME_RE.match(value):
        hours, minutes = value.split(":")
        return int(hours) * 60 + int(minutes)
    return None


def split_items(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"[,;\n]", text or "") if part.strip()]


def holiday_for(data: dict[str, Any], day: date) -> str | None:
    iso = day.isoformat()
    for holiday in data.get("holidays", []):
        if holiday["start"] and holiday["start"] <= iso <= (holiday["end"] or holiday["start"]):
            return holiday["name"]
    return None


def resolve_day(data: dict[str, Any], day_key: str) -> list[dict[str, Any]]:
    """Lecțiile (cu materie și ore valide) dintr-o zi, sortate după început."""
    subjects = {s["id"]: s for s in data["subjects"]}
    periods = data["periods"]
    lessons = []
    for idx, cell in enumerate(data["schedule"].get(day_key, [])):
        subject = subjects.get(cell.get("subject"))
        if not subject:
            continue
        period = periods[idx] if idx < len(periods) else {}
        start = cell.get("start") or period.get("start", "")
        end = cell.get("end") or period.get("end", "")
        start_min, end_min = to_min(start), to_min(end)
        if start_min is None or end_min is None or end_min <= start_min:
            continue
        lessons.append({
            "index": idx,
            "subject_id": subject["id"],
            "name": subject["name"],
            "short": subject["short"] or subject["name"],
            "color": subject["color"],
            "icon": subject["icon"] or "mdi:book-education",
            "teacher": subject["teacher"],
            "room": subject["room"],
            "items": split_items(subject["items"]),
            "note": cell.get("note", ""),
            "start": start,
            "end": end,
            "start_min": start_min,
            "end_min": end_min,
        })
    lessons.sort(key=lambda lesson: lesson["start_min"])
    return lessons


def lessons_on(data: dict[str, Any], day: date) -> list[dict[str, Any]]:
    if day.weekday() > 4 or holiday_for(data, day):
        return []
    return resolve_day(data, DAYS[day.weekday()])


def next_school_day(data: dict[str, Any], after: date, max_days: int = 60) -> tuple[date, list[dict[str, Any]]] | None:
    for offset in range(1, max_days + 1):
        day = after + timedelta(days=offset)
        lessons = lessons_on(data, day)
        if lessons:
            return day, lessons
    return None


def lesson_datetime(day: date, minutes: int) -> datetime:
    return dt_util.start_of_local_day(day) + timedelta(minutes=minutes)


def public_lesson(lesson: dict[str, Any] | None) -> dict[str, Any] | None:
    """Varianta lecției potrivită pentru atribute (fără câmpuri interne)."""
    if lesson is None:
        return None
    return {
        key: lesson[key]
        for key in ("name", "short", "start", "end", "room", "teacher", "note", "color", "icon")
    } | {"index": lesson["index"] + 1}


def compute_state(data: dict[str, Any], now: datetime) -> dict[str, Any]:
    today = now.date()
    weekday = today.weekday()
    holiday = holiday_for(data, today)
    day_key = DAYS[weekday] if weekday < 5 else None
    lessons = lessons_on(data, today)
    now_min = now.hour * 60 + now.minute + now.second / 60

    current = next((l for l in lessons if l["start_min"] <= now_min < l["end_min"]), None)
    upcoming = next((l for l in lessons if l["start_min"] > now_min), None)
    next_date = today if upcoming else None
    if upcoming is None:
        found = next_school_day(data, today)
        if found:
            next_date, next_lessons = found
            upcoming = next_lessons[0]

    if holiday:
        status = "holiday"
    elif day_key is None:
        status = "weekend"
    elif not lessons:
        status = "free"
    elif current:
        status = "lesson"
    elif now_min < lessons[0]["start_min"]:
        status = "before"
    elif now_min >= lessons[-1]["end_min"]:
        status = "after"
    else:
        status = "break"

    remaining = progress = None
    if current:
        total = current["end_min"] - current["start_min"]
        remaining = max(0, int(round(current["end_min"] - now_min)))
        progress = int(round(100 * (now_min - current["start_min"]) / total))

    minutes_until = None
    if upcoming and next_date:
        delta = lesson_datetime(next_date, upcoming["start_min"]) - now
        minutes_until = max(0, int(delta.total_seconds() // 60))

    pack = None
    found = next_school_day(data, today)
    if found:
        pack_day, pack_lessons = found
        subjects: list[str] = []
        items: list[str] = []
        for lesson in pack_lessons:
            if lesson["name"] not in subjects:
                subjects.append(lesson["name"])
            for item in lesson["items"]:
                if item.lower() not in (i.lower() for i in items):
                    items.append(item)
        pack = {
            "date": pack_day.isoformat(),
            "day": DAY_NAMES[DAYS[pack_day.weekday()]],
            "subjects": subjects,
            "items": items,
            "lessons": [public_lesson(l) for l in pack_lessons],
        }

    return {
        "date": today.isoformat(),
        "day_key": day_key,
        "day": DAY_NAMES.get(day_key) if day_key else None,
        "holiday": holiday,
        "status": status,
        "lessons": lessons,
        "current": current,
        "next": upcoming,
        "next_date": next_date.isoformat() if next_date else None,
        "next_day": DAY_NAMES[DAYS[next_date.weekday()]] if next_date else None,
        "remaining": remaining,
        "progress": progress,
        "minutes_until_next": minutes_until,
        "in_school": bool(lessons) and lessons[0]["start_min"] <= now_min < lessons[-1]["end_min"],
        "school_start": lesson_datetime(today, lessons[0]["start_min"]) if lessons else None,
        "school_end": lesson_datetime(today, lessons[-1]["end_min"]) if lessons else None,
        "pack": pack,
    }
