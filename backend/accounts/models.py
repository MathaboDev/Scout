from django.conf import settings
from django.db import models
from django.utils import timezone


class Student(models.Model):
    student_id = models.BigAutoField(primary_key=True, db_column="studentid")
    first_name = models.CharField(max_length=50, db_column="firstname")
    last_name = models.CharField(max_length=50, db_column="lastname")
    email = models.EmailField(max_length=100, unique=True, db_column="email")
    auth_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="authuserid",
        related_name="scout_student",
    )
    # schema.sql: nullable. Django's auth_user.password is the real
    # credential store, so we no longer write a second copy of the hash.
    password_hash = models.CharField(
        max_length=255, null=True, blank=True, db_column="passwordhash"
    )
    is_email_verified = models.BooleanField(default=False, db_column="isemailverified")
    # schema.sql default is lowercase 'active'
    account_status = models.CharField(max_length=20, default="active", db_column="accountstatus")
    created_at = models.DateTimeField(default=timezone.now, db_column="createdat")
    updated_at = models.DateTimeField(default=timezone.now, db_column="updatedat")

    class Meta:
        managed = False
        db_table = "student"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Profile(models.Model):
    profile_id = models.BigAutoField(primary_key=True, db_column="profileid")
    student = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        db_column="studentid",
        related_name="profile",
    )

    # Applies to all students
    student_type = models.CharField(max_length=30, db_column="studenttype")
    institution = models.CharField(max_length=100, db_column="institution")
    field_of_study = models.CharField(max_length=100, db_column="fieldofstudy")
    academic_average = models.FloatField(db_column="academicaverage")
    opportunity_preference = models.CharField(max_length=50, db_column="opportunitypreference")
    province = models.CharField(max_length=50, db_column="province")

    # Tertiary Student only
    year_level = models.BigIntegerField(null=True, blank=True, db_column="yearlevel")

    # Graduate only
    graduate_type = models.CharField(max_length=30, null=True, blank=True, db_column="graduatetype")
    qualification = models.CharField(max_length=50, null=True, blank=True, db_column="qualification")

    created_at = models.DateTimeField(auto_now_add=True, db_column="createdat")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedat")

    class Meta:
        managed = False
        db_table = "profile"

    def __str__(self):
        return f"Profile {self.profile_id}"

