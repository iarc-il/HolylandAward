"""Add linked callsigns and stop cascading QSO spotter updates

Revision ID: 003_linked_callsigns
Revises: 002_qso_spotter_cascade
Create Date: 2026-06-01 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003_linked_callsigns"
down_revision: Union[str, Sequence[str], None] = "002_qso_spotter_cascade"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create callsign links and decouple QSO spotters from current users."""
    op.drop_constraint("qso_logs_spotter_fkey", "qso_logs", type_="foreignkey")

    op.create_table(
        "linked_callsigns",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("old_callsign", sa.String(), nullable=False),
        sa.Column("new_callsign", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "old_callsign",
            "new_callsign",
            name="unique_user_callsign_link",
        ),
    )
    op.create_index(op.f("ix_linked_callsigns_id"), "linked_callsigns", ["id"])
    op.create_index(
        op.f("ix_linked_callsigns_user_id"), "linked_callsigns", ["user_id"]
    )
    op.create_index(
        op.f("ix_linked_callsigns_old_callsign"),
        "linked_callsigns",
        ["old_callsign"],
    )
    op.create_index(
        op.f("ix_linked_callsigns_new_callsign"),
        "linked_callsigns",
        ["new_callsign"],
    )


def downgrade() -> None:
    """Restore previous cascade behavior."""
    op.drop_index(
        op.f("ix_linked_callsigns_new_callsign"), table_name="linked_callsigns"
    )
    op.drop_index(
        op.f("ix_linked_callsigns_old_callsign"), table_name="linked_callsigns"
    )
    op.drop_index(op.f("ix_linked_callsigns_user_id"), table_name="linked_callsigns")
    op.drop_index(op.f("ix_linked_callsigns_id"), table_name="linked_callsigns")
    op.drop_table("linked_callsigns")

    op.create_foreign_key(
        "qso_logs_spotter_fkey",
        "qso_logs",
        "users",
        ["spotter"],
        ["callsign"],
        onupdate="CASCADE",
    )
