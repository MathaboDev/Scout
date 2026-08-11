from django.db import models
from django.utils import timezone

# Create your models here.
class Student(models.Model):
    student_id = models.AutoField(
        primary_key=True,
        db_column="studentid"
    )
    first_name = models.CharField(
        max_length=50,
        db_column="firstname"
    )
    last_name = models.CharField(
        max_length=50,
        db_column="lastname"
    )
    email = models.EmailField(
        max_length=100,
        unique=True,
        db_column="email"
    )
    password_hash = models.CharField(
        max_length=255,
        db_column="passwordhash"
    )
    is_email_verified = models.BooleanField(
        default=False,
        db_column="isemailverified"
    )
    account_status = models.CharField(
        max_length=20,
        default="Active",
        db_column="accountstatus"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        db_column="createdat"
    )
    updated_at = models.DateTimeField(
       default=timezone.now,
        db_column="updatedat"
    )

    class Meta:
        managed = False
        db_table = "student"