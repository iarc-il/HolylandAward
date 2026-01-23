"""Initial schema with qso_logs and users tables

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-01-19 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create qso_logs table
    op.create_table(
        "qso_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.String(), nullable=True),
        sa.Column("freq", sa.Float(), nullable=True),
        sa.Column("spotter", sa.String(), nullable=True),
        sa.Column("dx", sa.String(), nullable=True),
        sa.Column("area", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("spotter", "area", name="unique_spotter_area"),
    )
    op.create_index(op.f("ix_qso_logs_area"), "qso_logs", ["area"], unique=False)
    op.create_index(op.f("ix_qso_logs_dx"), "qso_logs", ["dx"], unique=False)
    op.create_index(op.f("ix_qso_logs_id"), "qso_logs", ["id"], unique=False)
    op.create_index(op.f("ix_qso_logs_spotter"), "qso_logs", ["spotter"], unique=False)

    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clerk_user_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("username", sa.String(), nullable=True),
        sa.Column("callsign", sa.String(), nullable=True),
        sa.Column("region", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_users_clerk_user_id"), "users", ["clerk_user_id"], unique=True
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=False)
    op.create_index(op.f("ix_users_callsign"), "users", ["callsign"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    # Create dummy users for existing spotter callsigns
    # These will have null clerk_user_id temporarily until users sign up with Clerk
    connection = op.get_bind()
    distinct_spotters = connection.execute(
        sa.text("SELECT DISTINCT spotter FROM qso_logs WHERE spotter IS NOT NULL")
    ).fetchall()
    for i, (spotter,) in enumerate(distinct_spotters):
        # Create dummy clerk_user_id for existing spotters
        dummy_clerk_id = f"legacy_user_{i}_{spotter}"
        connection.execute(
            sa.text(
                "INSERT INTO users (clerk_user_id, callsign) VALUES (:clerk_user_id, :callsign) ON CONFLICT (callsign) DO NOTHING"
            ),
            {"clerk_user_id": dummy_clerk_id, "callsign": spotter},
        )

    # Add foreign key constraint
    op.create_foreign_key(None, "qso_logs", "users", ["spotter"], ["callsign"])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key
    op.drop_constraint("qso_logs_spotter_fkey", "qso_logs", type_="foreignkey")

    # Drop users table
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_callsign"), table_name="users")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_clerk_user_id"), table_name="users")
    op.drop_table("users")

    # Drop qso_logs table
    op.drop_index(op.f("ix_qso_logs_spotter"), table_name="qso_logs")
    op.drop_index(op.f("ix_qso_logs_id"), table_name="qso_logs")
    op.drop_index(op.f("ix_qso_logs_dx"), table_name="qso_logs")
    op.drop_index(op.f("ix_qso_logs_area"), table_name="qso_logs")
    op.drop_table("qso_logs")
