from threading import Lock
from time import monotonic


CONNECTED_USER_TTL_SECONDS = 90
_connected_user_last_seen: dict[str, float] = {}
_connected_user_lock = Lock()


def _remove_stale_users(now: float) -> None:
    stale_user_ids = [
        user_id
        for user_id, last_seen in _connected_user_last_seen.items()
        if now - last_seen > CONNECTED_USER_TTL_SECONDS
    ]
    for user_id in stale_user_ids:
        del _connected_user_last_seen[user_id]


def mark_user_connected(user_id: str) -> None:
    now = monotonic()
    with _connected_user_lock:
        _connected_user_last_seen[user_id] = now
        _remove_stale_users(now)


def count_connected_users() -> int:
    now = monotonic()
    with _connected_user_lock:
        _remove_stale_users(now)
        return len(_connected_user_last_seen)
