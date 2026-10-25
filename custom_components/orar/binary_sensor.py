"""Binary sensor ORAR: „La școală”."""
from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .entity import OrarEntity


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([AtSchoolBinarySensor(hass.data[DOMAIN]["managers"][entry.entry_id])])


class AtSchoolBinarySensor(OrarEntity, BinarySensorEntity):
    """Pornit între începutul primei ore și sfârșitul ultimei ore."""

    def __init__(self, manager) -> None:
        super().__init__(manager, "at_school", "La școală")

    @property
    def is_on(self) -> bool:
        return self.state_data["in_school"]

    @property
    def icon(self) -> str:
        return "mdi:school" if self.is_on else "mdi:home"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"in_lesson": self.state_data["current"] is not None}
