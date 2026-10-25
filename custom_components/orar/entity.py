"""Entitate de bază ORAR."""
from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import Entity

from .const import DOMAIN, VERSION, signal_state
from .manager import OrarManager


class OrarEntity(Entity):
    """Se actualizează la fiecare minut / la fiecare modificare a orarului."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, manager: OrarManager, key: str, name: str) -> None:
        self.manager = manager
        self._attr_unique_id = f"{manager.entry_id}_{key}"
        self._attr_name = name
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, manager.entry_id)},
            name=manager.title,
            manufacturer="ORAR",
            model="Orar școlar",
            sw_version=VERSION,
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def state_data(self) -> dict:
        return self.manager.state

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass, signal_state(self.manager.entry_id), self.async_write_ha_state
            )
        )
