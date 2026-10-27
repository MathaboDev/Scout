from django.db import models

# Create your models here.
from django.db import models
from django.utils import timezone


class Notification(models.Model):
    """
    Maps to the `notification` table. One row per channel actually used:
    channel = 'in_app' (always) and 'email' (when the email was handed to
    the mail server). The in-app feed only reads in_app rows.
    """

    notification_id = models.BigAutoField(primary_key=True, db_column="notificationid")
    student_id = models.BigIntegerField(db_column="studentid")
    application_id = models.BigIntegerField(null=True, blank=True, db_column="applicationid")
    bookmark_id = models.BigIntegerField(null=True, blank=True, db_column="bookmarkid")
    notification_type = models.CharField(max_length=50, db_column="notificationtype")
    channel = models.CharField(max_length=20, db_column="channel")
    message = models.TextField(db_column="message")
    is_read = models.BooleanField(default=False, db_column="isread")
    sent_at = models.DateTimeField(default=timezone.now, db_column="sentat")

    class Meta:
        managed = False
        db_table = "notification"

