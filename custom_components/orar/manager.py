"""Managerul unui orar: stocare, notificări, evenimente de început/sfârșit de oră."""
from __future__ import annotations

import logging
import os
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    DOMAIN,
    EVENT_LESSON_END,
    EVENT_LESSON_START,
    MEDIA_DIR,
    STORAGE_VERSION,
    signal_data,
    signal_state,
)
from .data import default_data, sanitize
from .schedule import compute_state

_LOGGER = logging.getLogger(__name__)

DATA_KEYS = ("subjects", "periods", "schedule", "appearance", "holidays")


class OrarManager:
    """Ține datele unui orar și starea calculată în timp real."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self._store: Store = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}")
        self.data: dict[str, Any] = {}
        self.state: dict[str, Any] = {}
        self._unsub_tick: CALLBACK_TYPE | None = None
        self._current_key: tuple | None = None
        self._current_lesson: dict[str, Any] | None = None

    @property
    def entry_id(self) -> str:
        return self.entry.entry_id

    @property
    def title(self) -> str:
        return self.entry.title

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        if stored is None:
            self.data = default_data()
            await self._store.async_save(self.data)
        else:
            self.data = sanitize(stored)
        self._refresh(fire_events=False)
        self._unsub_tick = async_track_time_change(self.hass, self._handle_tick, second=0)

    @callback
    def async_shutdown(self) -> None:
        if self._unsub_tick:
            self._unsub_tick()
            self._unsub_tick = None

    async def async_update(self, partial: dict[str, Any]) -> dict[str, Any]:
        """Actualizează parțial datele (doar cheile primite) și salvează."""
        merged = dict(self.data)
        for key in DATA_KEYS:
            if key in partial:
                merged[key] = partial[key]
        self.data = sanitize(merged)
        await self._store.async_save(self.data)
        async_dispatcher_send(self.hass, signal_data(self.entry_id))
        self._refresh(fire_events=False)
        return self.data

    @callback
    def _handle_tick(self, _now) -> None:
        self._refresh(fire_events=True)

    @callback
    def _refresh(self, fire_events: bool) -> None:
        state = compute_state(self.data, dt_util.now())
        current = state["current"]
        key = (state["date"], current["index"], current["start"], current["subject_id"]) if current else None
        if fire_events and key != self._current_key:
            if self._current_lesson:
                self.hass.bus.async_fire(EVENT_LESSON_END, self._payload(self._current_lesson, state))
            if current:
                self.hass.bus.async_fire(EVENT_LESSON_START, self._payload(current, state))
        self._current_key = key
        self._current_lesson = current
        self.state = state
        async_dispatcher_send(self.hass, signal_state(self.entry_id))

    def _payload(self, lesson: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
        lessons = state["lessons"]
        return {
            "entry_id": self.entry_id,
            "orar": self.title,
            "subject": lesson["name"],
            "subject_id": lesson["subject_id"],
            "index": lesson["index"] + 1,
            "start": lesson["start"],
            "end": lesson["end"],
            "room": lesson["room"],
            "teacher": lesson["teacher"],
            "note": lesson["note"],
            "is_first": bool(lessons) and lessons[0]["index"] == lesson["index"],
            "is_last": bool(lessons) and lessons[-1]["index"] == lesson["index"],
        }

    @staticmethod
    async def async_remove_storage(hass: HomeAssistant, entry_id: str) -> None:
        await Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry_id}").async_remove()
        media = hass.config.path(MEDIA_DIR)

        def _cleanup() -> None:
            if not os.path.isdir(media):
                return
            for name in os.listdir(media):
                if name.startswith(f"{entry_id}_"):
                    os.remove(os.path.join(media, name))

        await hass.async_add_executor_job(_cleanup)
