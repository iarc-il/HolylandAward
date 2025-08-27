from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select
from qsos.models import QSOLogs
from qsos.schema import QSO, QSOResponse


class QSORepository:
    def __init__(self, db: Session):
        self.db = db

    def insert_qsos(self, qsos: list[QSO]) -> list[QSOResponse]:
        """
        Insert multiple QSO entries in a single batch operation.
        If spotter+area combination exists, do nothing.
        Returns only the newly inserted records.
        """
        if not qsos:
            return []

        # Single batch insert with conflict handling
        stmt = insert(QSOLogs).values([qso.model_dump() for qso in qsos])
        stmt = stmt.on_conflict_do_nothing(constraint="unique_spotter_area")
        returning_stmt = stmt.returning(QSOLogs)  # Return only newly inserted records

        result = self.db.execute(returning_stmt)
        self.db.commit()

        # Convert to response objects
        newly_inserted = result.fetchall()
        return [QSOResponse.model_validate(qso[0]) for qso in newly_inserted]

    def get_all_qsos(self) -> list[QSOResponse]:
        """Get all QSO entries."""
        qso_records = self.db.query(QSOLogs).all()
        return [QSOResponse.model_validate(qso) for qso in qso_records]

    def get_qsos_by_spotter(self, spotter: str) -> list[QSOResponse]:
        """Get all QSO entries for a specific spotter."""
        qso_records = self.db.query(QSOLogs).filter(QSOLogs.spotter == spotter).all()
        return [QSOResponse.model_validate(qso) for qso in qso_records]

    def get_areas_by_spotter(self, spotter: str) -> list[str]:
        """Get all areas for a specific spotter."""
        stmt = select(QSOLogs.area).where(QSOLogs.spotter == spotter).distinct()
        result = self.db.execute(stmt)
        areas = result.scalars().all()
        return list(areas)
