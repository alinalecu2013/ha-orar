"""API websocket folosit de panoul ORAR și de cardul Lovelace."""
from __future__ import annotations

import base64
import binascii
import os
import time
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import (
    ALLOWED_IMAGE_EXT,
    DOMAIN,
    MAX_UPLOAD_BYTES,
    MEDIA_DIR,
    MEDIA_URL,
    signal_data,
)


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_list)
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_save)
    websocket_api.async_register_command(hass, ws_upload)


def _manager(hass: HomeAssistant, entry_id: str):
    return hass.data.get(DOMAIN, {}).get("managers", {}).get(entry_id)


@websocket_api.websocket_command({vol.Required("type"): "orar/list"})
@callback
def ws_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    managers = hass.data.get(DOMAIN, {}).get("managers", {})
    connection.send_result(
        msg["id"],
        [{"entry_id": m.entry_id, "title": m.title} for m in managers.values()],
    )


@websocket_api.websocket_command(
    {vol.Required("type"): "orar/subscribe", vol.Required("entry_id"): str}
)
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    manager = _manager(hass, msg["entry_id"])
    if manager is None:
        connection.send_error(msg["id"], "not_found", "Orarul nu există")
        return

    @callback
    def forward() -> None:
        connection.send_message(
            websocket_api.event_message(
                msg["id"], {"entry_id": manager.entry_id, "title": manager.title, "data": manager.data}
            )
        )

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(
        hass, signal_data(manager.entry_id), forward
    )
    connection.send_result(msg["id"])
    forward()


@websocket_api.websocket_command(
    {
        vol.Required("type"): "orar/save",
        vol.Required("entry_id"): str,
        vol.Required("data"): dict,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    manager = _manager(hass, msg["entry_id"])
    if manager is None:
        connection.send_error(msg["id"], "not_found", "Orarul nu există")
        return
    data = await manager.async_update(msg["data"])
    connection.send_result(msg["id"], {"data": data})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "orar/upload",
        vol.Required("entry_id"): str,
        vol.Required("filename"): str,
        vol.Required("content"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_upload(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Salvează o imagine de fundal (base64) și întoarce URL-ul ei."""
    entry_id = msg["entry_id"]
    if _manager(hass, entry_id) is None:
        connection.send_error(msg["id"], "not_found", "Orarul nu există")
        return

    ext = msg["filename"].rsplit(".", 1)[-1].lower() if "." in msg["filename"] else ""
    if ext not in ALLOWED_IMAGE_EXT:
        connection.send_error(msg["id"], "invalid_format", "Format acceptat: JPG, PNG, WEBP, GIF")
        return

    content = msg["content"].split(",", 1)[-1]
    try:
        raw = base64.b64decode(content, validate=True)
    except (binascii.Error, ValueError):
        connection.send_error(msg["id"], "invalid_data", "Imagine invalidă")
        return
    if len(raw) > MAX_UPLOAD_BYTES:
        connection.send_error(msg["id"], "too_large", "Imaginea este prea mare (max 12 MB)")
        return

    media = hass.config.path(MEDIA_DIR)
    filename = f"{entry_id}_{int(time.time())}.{ext}"

    def _write() -> None:
        os.makedirs(media, exist_ok=True)
        # păstrăm o singură imagine per orar
        for name in os.listdir(media):
            if name.startswith(f"{entry_id}_"):
                os.remove(os.path.join(media, name))
        with open(os.path.join(media, filename), "wb") as file:
            file.write(raw)

    await hass.async_add_executor_job(_write)
    connection.send_result(msg["id"], {"url": f"{MEDIA_URL}/{filename}"})
