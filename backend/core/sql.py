"""
Tiny helper for the project's deliberate raw-SQL queries
(eligibility matching, application tracking, summary report).

Always pass values through `params` so they become %s placeholders;
never format user input into the SQL string.
"""

from django.db import connection


def fetch_all(sql, params=None):
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def fetch_one(sql, params=None):
    rows = fetch_all(sql, params)
    return rows[0] if rows else None

