"""Calendar ORAR: fiecare oră din orar apare ca eveniment recurent."""
from __future__ import annotations

from datetime import datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .entity import OrarEntity
from .schedule import lesson_datetime, lessons_on


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([OrarCalendar(hass.data[DOMAIN]["managers"][entry.entry_id])])


def _event(day, lesson) -> CalendarEvent:
    details = [
        f"Profesor: {lesson['teacher']}" if lesson["teacher"] else "",
        f"Notă: {lesson['note']}" if lesson["note"] else "",
        f"De luat: {', '.join(lesson['items'])}" if lesson["items"] else "",
    ]
    return CalendarEvent(
        start=lesson_datetime(day, lesson["start_min"]),
        end=lesson_datetime(day, lesson["end_min"]),
        summary=lesson["name"],
        location=lesson["room"] or None,
        description="\n".join(d for d in details if d) or None,
        uid=f"{day.isoformat()}-{lesson['index']}",
    )


class OrarCalendar(OrarEntity, CalendarEntity):
    _attr_icon = "mdi:timetable"

    def __init__(self, manager) -> None:
        super().__init__(manager, "calendar", "Orar")

    @property
    def event(self) -> CalendarEvent | None:
        state = self.state_data
        if state["current"]:
            return _event(dt_util.now().date(), state["current"])
        if state["next"] and state["next_date"]:
            return _event(datetime.fromisoformat(state["next_date"]).date(), state["next"])
        return None

    async def async_get_events(self, hass: HomeAssistant, start_date: datetime, end_date: datetime) -> list[CalendarEvent]:
        data = self.manager.data
        events: list[CalendarEvent] = []
        day = dt_util.as_local(start_date).date()
        last = dt_util.as_local(end_date).date()
        while day <= last:
            for lesson in lessons_on(data, day):
                event = _event(day, lesson)
                if event.end > start_date and event.start < end_date:
                    events.append(event)
            day += timedelta(days=1)
        return events
