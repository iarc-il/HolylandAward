from sqlalchemy.orm import Session
from system_settings.models import SystemSetting
from typing import Optional


USER_LIMIT_SETTING_KEY = "user_limit"


def get_setting(db: Session, key: str) -> Optional[str]:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return setting.value if setting else None


def set_setting(db: Session, key: str, value: str) -> None:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting:
        setting.value = value
    else:
        db.add(SystemSetting(key=key, value=value))
    db.commit()


def delete_setting(db: Session, key: str) -> None:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting:
        db.delete(setting)
        db.commit()


def get_int_setting(db: Session, key: str) -> Optional[int]:
    value = get_setting(db, key)
    if value is None:
        return None

    try:
        parsed_value = int(value)
    except ValueError:
        return None

    return parsed_value if parsed_value >= 0 else None


def get_user_limit(db: Session) -> Optional[int]:
    return get_int_setting(db, USER_LIMIT_SETTING_KEY)


def set_user_limit(db: Session, user_limit: Optional[int]) -> None:
    if user_limit is None:
        delete_setting(db, USER_LIMIT_SETTING_KEY)
        return

    set_setting(db, USER_LIMIT_SETTING_KEY, str(user_limit))
