"""Senzori ORAR."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .entity import OrarEntity
from .schedule import public_lesson

STATUS_ICONS = {
    "break": "mdi:coffee",
    "before": "mdi:weather-sunset-up",
    "after": "mdi:check-circle",
    "weekend": "mdi:party-popper",
    "holiday": "mdi:beach",
    "free": "mdi:sleep",
}
STATUS_LABELS = {
    "lesson": "La oră",
    "break": "Pauză",
    "before": "Înainte de ore",
    "after": "Gata pe azi",
    "weekend": "Weekend",
    "holiday": "Vacanță",
    "free": "Zi liberă",
}


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    manager = hass.data[DOMAIN]["managers"][entry.entry_id]
    async_add_entities([
        CurrentLessonSensor(manager),
        NextLessonSensor(manager),
        TodaySensor(manager),
        SchoolEndSensor(manager),
        BackpackSensor(manager),
    ])


class CurrentLessonSensor(OrarEntity, SensorEntity):
    """Materia de acum: numele materiei, „Pauză” sau „Liber”."""

    def __init__(self, manager) -> None:
        super().__init__(manager, "current", "Materia curentă")

    @property
    def native_value(self) -> str:
        state = self.state_data
        if state["current"]:
            return state["current"]["name"]
        return "Pauză" if state["status"] == "break" else "Liber"

    @property
    def icon(self) -> str:
        state = self.state_data
        if state["current"]:
            return state["current"]["icon"]
        return STATUS_ICONS.get(state["status"], "mdi:school")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        state = self.state_data
        current = state["current"]
        attrs: dict[str, Any] = {
            "status": state["status"],
            "status_text": STATUS_LABELS[state["status"]],
            "holiday": state["holiday"],
            "remaining_minutes": state["remaining"],
            "progress": state["progress"],
        }
        if current:
            attrs.update(public_lesson(current))
        return attrs


class NextLessonSensor(OrarEntity, SensorEntity):
    """Următoarea materie (azi sau în următoarea zi de școală)."""

    _attr_icon = "mdi:skip-next-circle"

    def __init__(self, manager) -> None:
        super().__init__(manager, "next", "Următoarea materie")

    @property
    def native_value(self) -> str | None:
        upcoming = self.state_data["next"]
        return upcoming["name"] if upcoming else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        state = self.state_data
        attrs = public_lesson(state["next"]) or {}
        attrs.update({
            "date": state["next_date"],
            "day": state["next_day"],
            "minutes_until": state["minutes_until_next"],
        })
        return attrs


class TodaySensor(OrarEntity, SensorEntity):
    """Numărul de ore de azi + lista lor."""

    _attr_icon = "mdi:calendar-today"
    _attr_native_unit_of_measurement = "ore"

    def __init__(self, manager) -> None:
        super().__init__(manager, "today", "Ore azi")

    @property
    def native_value(self) -> int:
        return len(self.state_data["lessons"])

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        state = self.state_data
        lessons = state["lessons"]
        return {
            "day": state["day"],
            "holiday": state["holiday"],
            "first_start": lessons[0]["start"] if lessons else None,
            "last_end": lessons[-1]["end"] if lessons else None,
            "lessons": [public_lesson(lesson) for lesson in lessons],
            "summary": ", ".join(f"{l['start']} {l['short']}" for l in lessons),
        }


class SchoolEndSensor(OrarEntity, SensorEntity):
    """Ora la care se termină școala azi (timestamp)."""

    _attr_icon = "mdi:bell-ring"
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, manager) -> None:
        super().__init__(manager, "school_end", "Final ore azi")

    @property
    def native_value(self) -> datetime | None:
        return self.state_data["school_end"]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        start = self.state_data["school_start"]
        return {"school_start": start.isoformat() if start else None}


class BackpackSensor(OrarEntity, SensorEntity):
    """Ghiozdanul pentru următoarea zi de școală: materii + lucruri de luat."""

    _attr_icon = "mdi:bag-personal"
    _attr_native_unit_of_measurement = "materii"

    def __init__(self, manager) -> None:
        super().__init__(manager, "backpack", "Ghiozdan")

    @property
    def native_value(self) -> int | None:
        pack = self.state_data["pack"]
        return len(pack["subjects"]) if pack else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        pack = self.state_data["pack"]
        if not pack:
            return {}
        return {
            "day": pack["day"],
            "date": pack["date"],
            "subjects": pack["subjects"],
            "items": pack["items"],
            "summary": f"{pack['day']}: " + ", ".join(pack["subjects"]),
            "lessons": pack["lessons"],
        }
