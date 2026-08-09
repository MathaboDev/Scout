"""
core/db_utils.py

Thin wrapper around Django's raw-SQL cursor, for the specific queries in
Scout that use raw parameterized SQL instead of the ORM:

    - opportunities: eligibility matching
    - applications: application tracking

Everywhere else in the project, use the Django ORM (or ORM-backed models
with managed = False, per Rule 25). Raw SQL is the documented exception
for exactly these two performance-sensitive/complex queries — reach for
this module only when the ORM genuinely can't express the query cleanly.

SECURITY RULE (non-negotiable — Rule 24):
Every value that varies per-request MUST be passed through the `params`
argument and referenced with %s placeholders in `sql`. Never build `sql`
with an f-string, .format(), or string concatenation using request data.

    # Good
    run_query(
        "SELECT * FROM opportunity WHERE field_of_study = %s",
        [field_of_study],
    )

    # NEVER do this — SQL injection risk
    run_query(f"SELECT * FROM opportunity WHERE field_of_study = '{field_of_study}'")

These functions don't magically block bad SQL — someone can still choose
to f-string the `sql` argument itself. What they do is give the team one
obvious, easy-to-review call shape, so anything that deviates from it
(anyone typing `.format(` or an f-string inside a query) stands out
immediately in a pull request.
"""

from contextlib import contextmanager
from typing import Any, Sequence

from django.db import connection


@contextmanager
def get_cursor():
    """
    Context manager yielding a Django DB cursor bound to the default
    connection (the Supabase PostgreSQL database).

    Prefer run_query / run_command / run_scalar below for typical use —
    reach for this directly only if you need several statements to share
    one cursor/transaction.
    """
    with connection.cursor() as cursor:
        yield cursor


def run_query(sql: str, params: Sequence[Any] = ()) -> list[dict]:
    """
    Run a parameterized SELECT and return rows as a list of dicts
    (column_name -> value), so callers don't need to depend on column
    order matching their code.

    `params` is positional and maps to each %s in `sql`, in order.
    """
    with get_cursor() as cursor:
        cursor.execute(sql, params)
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def run_command(sql: str, params: Sequence[Any] = ()) -> int:
    """
    Run a parameterized INSERT/UPDATE/DELETE. Returns the number of rows
    affected.

    Runs on Django's existing connection/transaction — if this command
    needs to be atomic together with other operations (e.g. creating an
    application AND a receipt), wrap the calling code in
    django.db.transaction.atomic() rather than trying to manage that here
    (see Rule 30, concurrency).
    """
    with get_cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.rowcount


def run_scalar(sql: str, params: Sequence[Any] = ()) -> Any:
    """
    Run a parameterized query expected to return exactly one column of one
    row (e.g. a COUNT(*) or an EXISTS check), and return that single
    value. Returns None if the query returned no rows.
    """
    with get_cursor() as cursor:
        cursor.execute(sql, params)
        row = cursor.fetchone()
        return row[0] if row else None