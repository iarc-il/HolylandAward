"""Cascade QSO spotter updates when user callsign changes

Revision ID: 002_qso_spotter_cascade
Revises: 001_initial_schema
Create Date: 2026-05-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "002_qso_spotter_cascade"
down_revision: Union[str, Sequence[str], None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Recreate the spotter foreign key with ON UPDATE CASCADE."""
    op.drop_constraint("qso_logs_spotter_fkey", "qso_logs", type_="foreignkey")
    op.create_foreign_key(
        "qso_logs_spotter_fkey",
        "qso_logs",
        "users",
        ["spotter"],
        ["callsign"],
        onupdate="CASCADE",
    )


def downgrade() -> None:
    """Restore the previous spotter foreign key behavior."""
    op.drop_constraint("qso_logs_spotter_fkey", "qso_logs", type_="foreignkey")
    op.create_foreign_key(
        "qso_logs_spotter_fkey",
        "qso_logs",
        "users",
        ["spotter"],
        ["callsign"],
    )
