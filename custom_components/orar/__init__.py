"""ORAR – orar școlar interactiv pentru Home Assistant."""
from __future__ import annotations

import logging
import os
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    MEDIA_DIR,
    MEDIA_URL,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL,
    STATIC_URL,
    VERSION,
)
from .manager import OrarManager
from .services import async_register_services
from .websocket import async_register_websocket

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR, Platform.CALENDAR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

FRONTEND_DIR = Path(__file__).parent / "frontend"
MODULE_URL = f"{STATIC_URL}/orar.js?v={VERSION}"


async def _async_register_static(hass: HomeAssistant, media_path: str) -> None:
    paths = [(STATIC_URL, str(FRONTEND_DIR)), (MEDIA_URL, media_path)]
    try:
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths(
            [StaticPathConfig(url, path, False) for url, path in paths]
        )
    except ImportError:  # Home Assistant < 2024.7
        for url, path in paths:
            hass.http.register_static_path(url, path, False)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    hass.data.setdefault(DOMAIN, {"managers": {}, "panel": False})
    media_path = hass.config.path(MEDIA_DIR)
    await hass.async_add_executor_job(lambda: os.makedirs(media_path, exist_ok=True))
    await _async_register_static(hass, media_path)
    # Face cardul Lovelace „custom:orar-card” disponibil fără resursă manuală.
    frontend.add_extra_js_url(hass, MODULE_URL)
    async_register_websocket(hass)
    async_register_services(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    manager = OrarManager(hass, entry)
    await manager.async_load()
    hass.data[DOMAIN]["managers"][entry.entry_id] = manager
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    if not hass.data[DOMAIN]["panel"]:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL,
            webcomponent_name="orar-panel",
            module_url=MODULE_URL,
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            require_admin=False,
            config={},
        )
        hass.data[DOMAIN]["panel"] = True
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        domain_data = hass.data[DOMAIN]
        manager: OrarManager = domain_data["managers"].pop(entry.entry_id)
        manager.async_shutdown()
        if not domain_data["managers"] and domain_data["panel"]:
            frontend.async_remove_panel(hass, PANEL_URL)
            domain_data["panel"] = False
    return unloaded


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await OrarManager.async_remove_storage(hass, entry.entry_id)
