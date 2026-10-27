from django.conf import settings
from django.db import models
from django.utils import timezone


class Provider(models.Model):
    """
    A company that posts opportunities (FR10).

    Maps to the hand-written `provider` table. `auth_user` relies on the
    authuserid column added by sql/2026-10-27_provider_auth.sql, the same
    pattern student.authuserid uses, so a provider can log in through the
    shared /api/accounts/login/ endpoint.
    """

    provider_id = models.BigAutoField(primary_key=True, db_column="providerid")
    company_name = models.CharField(max_length=100, db_column="companyname")
    email = models.EmailField(max_length=100, unique=True, db_column="email")
    phone = models.CharField(max_length=20, null=True, blank=True, db_column="phone")
    industry = models.CharField(max_length=100, db_column="industry")
    province = models.CharField(max_length=50, db_column="province")
    auth_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="authuserid",
        related_name="scout_provider",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column="createdat")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedat")

    class Meta:
        managed = False
        db_table = "provider"

    def __str__(self):
        return self.company_name


class PlatformAdmin(models.Model):
    """
    Platform administrator (FR9 / FR10). Every opportunity row needs an
    adminid, and verification is recorded against one of these rows.
    Named PlatformAdmin so it never clashes with django.contrib.admin.
    """

    admin_id = models.BigAutoField(primary_key=True, db_column="adminid")
    first_name = models.CharField(max_length=50, db_column="firstname")
    last_name = models.CharField(max_length=50, db_column="lastname")
    email = models.EmailField(max_length=100, unique=True, db_column="email")
    password = models.CharField(max_length=255, db_column="password")
    role = models.CharField(max_length=30, default="moderator", db_column="role")
    is_active = models.BooleanField(default=True, db_column="isactive")
    created_at = models.DateTimeField(default=timezone.now, db_column="createdat")
    last_login_at = models.DateTimeField(null=True, blank=True, db_column="lastloginat")

    class Meta:
        managed = False
        db_table = "admin"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

