from sqlalchemy.orm import Session
from system_settings.models import SystemSetting
from typing import Optional


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