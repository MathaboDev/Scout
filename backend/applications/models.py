from django.db import models
from django.utils import timezone

from core.choices import APPLICATION_STATUSES, STATUS_SUBMITTED


class Application(models.Model):
    """
    Maps to the `application` table. UNIQUE(studentid, opportunityid) is
    enforced by Postgres (uq_student_application), so the views just catch
    IntegrityError instead of pre-checking (NFR5).

    Status lifecycle (FR5/FR6), forward only:
        Submitted -> Under Review -> Outcome Received
    outcome_result ('Successful' | 'Unsuccessful') is set only together
    with Outcome Received.
    """

    STATUS_CHOICES = [(s, s) for s in APPLICATION_STATUSES]

    application_id = models.BigAutoField(primary_key=True, db_column="applicationid")
    student_id = models.BigIntegerField(db_column="studentid")
    opportunity_id = models.BigIntegerField(db_column="opportunityid")

    reference_number = models.CharField(max_length=50, unique=True, db_column="referencenumber")
    status = models.CharField(
        max_length=30, default=STATUS_SUBMITTED, choices=STATUS_CHOICES, db_column="status"
    )

    submitted_at = models.DateTimeField(default=timezone.now, db_column="submittedat")
    reviewed_at = models.DateTimeField(null=True, blank=True, db_column="reviewedat")
    outcome_received_at = models.DateTimeField(null=True, blank=True, db_column="outcomereceivedat")
    outcome_result = models.CharField(max_length=20, null=True, blank=True, db_column="outcomeresult")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedat")

    class Meta:
        managed = False
        db_table = "application"

    def __str__(self):
        return f"{self.reference_number} (student {self.student_id})"


class Bookmark(models.Model):
    """Maps to the `bookmark` table (UNIQUE(studentid, opportunityid) in DB)."""

    bookmark_id = models.BigAutoField(primary_key=True, db_column="bookmarkid")
    student_id = models.BigIntegerField(db_column="studentid")
    opportunity_id = models.BigIntegerField(db_column="opportunityid")
    saved_at = models.DateTimeField(default=timezone.now, db_column="savedat")
    reminder_sent = models.BooleanField(default=False, db_column="remindersent")

    class Meta:
        managed = False
        db_table = "bookmark"

