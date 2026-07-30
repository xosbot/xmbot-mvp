from __future__ import annotations

import json
import logging
import os
from pathlib import Path


log = logging.getLogger("xmbot.persistence")


class Persistence:
    def __init__(self, data_dir: str | None = None) -> None:
        self._data_dir = Path(data_dir or os.getenv("DATA_DIR", "./data"))
        self._data_dir.mkdir(parents=True, exist_ok=True)
        self._file_path = self._data_dir / "sync_store.json"

    def load(self) -> dict:
        if not self._file_path.exists():
            return {}
        try:
            return json.loads(self._file_path.read_text())
        except Exception:
            log.exception("Failed to load sync store from %s", self._file_path)
            return {}

    async def save(self, data: dict) -> None:
        tmp = self._file_path.with_suffix(".tmp")
        try:
            tmp.write_text(json.dumps(data, indent=2, default=str))
            tmp.replace(self._file_path)
        except Exception:
            log.exception("Failed to save sync store to %s", self._file_path)
