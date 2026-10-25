"""Servicii ORAR pentru automatizări și scripturi."""
from __future__ import annotations

import copy

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import DAY_ALIASES, DOMAIN, MAX_SLOTS
from .data import TIME_RE

ATTR_ORAR = "orar"

BASE = {
    vol.Optional(ATTR_ORAR): cv.string,
    vol.Required("day"): cv.string,
    vol.Required("index"): vol.All(vol.Coerce(int), vol.Range(min=1, max=MAX_SLOTS)),
}
SET_LESSON_SCHEMA = vol.Schema(
    {
        **BASE,
        vol.Optional("subject"): cv.string,
        vol.Optional("start"): cv.string,
        vol.Optional("end"): cv.string,
        vol.Optional("note"): cv.string,
    }
)
CLEAR_LESSON_SCHEMA = vol.Schema(BASE)


def _find_manager(hass: HomeAssistant, orar: str | None):
    managers = list(hass.data.get(DOMAIN, {}).get("managers", {}).values())
    if orar:
        for manager in managers:
            if orar in (manager.entry_id, manager.title) or orar.lower() == manager.title.lower():
                return manager
        raise HomeAssistantError(f"Nu există orarul „{orar}”")
    if len(managers) == 1:
        return managers[0]
    raise HomeAssistantError("Specifică orarul (câmpul „orar”) – există mai multe")


def _day(value: str) -> str:
    key = DAY_ALIASES.get(value.strip().lower())
    if not key:
        raise HomeAssistantError(f"Zi necunoscută: {value} (folosește luni…vineri)")
    return key


def _time(value: str | None, label: str) -> str | None:
    if value is None:
        return None
    value = value.strip()[:5]
    if value and not TIME_RE.match(value):
        raise HomeAssistantError(f"Ora de {label} trebuie să fie HH:MM")
    return value


@callback
def async_register_services(hass: HomeAssistant) -> None:
    async def set_lesson(call: ServiceCall) -> None:
        manager = _find_manager(hass, call.data.get(ATTR_ORAR))
        day, idx = _day(call.data["day"]), call.data["index"] - 1
        schedule = copy.deepcopy(manager.data["schedule"])
        cells = schedule[day]
        while len(cells) <= idx:
            cells.append({"subject": None, "start": "", "end": "", "note": ""})
        cell = cells[idx]

        if "subject" in call.data:
            wanted = call.data["subject"].strip().lower()
            if wanted in ("", "-", "liber", "none"):
                cell["subject"] = None
            else:
                match = next(
                    (
                        s for s in manager.data["subjects"]
                        if wanted in (s["id"].lower(), s["name"].lower(), s["short"].lower())
                    ),
                    None,
                )
                if match is None:
                    raise HomeAssistantError(f"Materia „{call.data['subject']}” nu e în baza de date")
                cell["subject"] = match["id"]
        start = _time(call.data.get("start"), "început")
        end = _time(call.data.get("end"), "sfârșit")
        if start is not None:
            cell["start"] = start
        if end is not None:
            cell["end"] = end
        if "note" in call.data:
            cell["note"] = call.data["note"]
        await manager.async_update({"schedule": schedule})

    async def clear_lesson(call: ServiceCall) -> None:
        manager = _find_manager(hass, call.data.get(ATTR_ORAR))
        day, idx = _day(call.data["day"]), call.data["index"] - 1
        schedule = copy.deepcopy(manager.data["schedule"])
        if idx < len(schedule[day]):
            schedule[day][idx] = {"subject": None, "start": "", "end": "", "note": ""}
            await manager.async_update({"schedule": schedule})

    hass.services.async_register(DOMAIN, "set_lesson", set_lesson, SET_LESSON_SCHEMA)
    hass.services.async_register(DOMAIN, "clear_lesson", clear_lesson, CLEAR_LESSON_SCHEMA)
