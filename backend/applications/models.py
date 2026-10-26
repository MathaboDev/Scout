from django.db import models


class Application(models.Model):
    """
    Corrected against the real schema.sql: a reference number and a richer
    outcome lifecycle (submitted -> reviewed -> outcome), not just a
    timestamp. UNIQUE(studentid, opportunityid) is enforced in the
    database (uq_student_application), so no need to pre-check for a
    duplicate before creating, only handle the IntegrityError if Postgres
    rejects one.
    """

    STATUS_CHOICES = [
        ("Submitted", "Submitted"),
        ("Under review", "Under review"),
        ("Decided", "Decided"),
    ]

    application_id = models.BigAutoField(primary_key=True, db_column="applicationid")
    student_id = models.BigIntegerField(db_column="studentid")
    opportunity_id = models.BigIntegerField(db_column="opportunityid")

    reference_number = models.CharField(max_length=50, unique=True, db_column="referencenumber")
    status = models.CharField(max_length=30, default="Submitted", choices=STATUS_CHOICES, db_column="status")

    submitted_at = models.DateTimeField(auto_now_add=True, db_column="submittedat")
    reviewed_at = models.DateTimeField(null=True, blank=True, db_column="reviewedat")
    outcome_received_at = models.DateTimeField(null=True, blank=True, db_column="outcomereceivedat")
    outcome_result = models.CharField(max_length=20, null=True, blank=True, db_column="outcomeresult")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedat")

    class Meta:
        managed = False
        db_table = "application"

    def __str__(self):
        return f"{self.reference_number} (student {self.student_id})"