from django.db import models


class Provider(models.Model):
    """
    Maps to the provider table in schema.sql. Note what's NOT here yet:
    there is no authuserid column (unlike Student) and no password/hash
    column either, so as the schema currently stands a provider has no
    way to actually log in.

    Recommended fix, matching the pattern Student already uses: add an
    authuserid column to provider (FK to auth_user.id, same as Student
    has), then set it on signup and look it up the same way
    get_student_id does. I've written get_provider_id in
    core/auth_utils_additions.py on that assumption -- it will need that
    column to exist before it works.
    """

    provider_id = models.BigAutoField(primary_key=True, db_column="providerid")
    company_name = models.CharField(max_length=100, db_column="companyname")
    email = models.EmailField(max_length=100, unique=True, db_column="email")
    phone = models.CharField(max_length=20, null=True, blank=True, db_column="phone")
    industry = models.CharField(max_length=100, db_column="industry")
    province = models.CharField(max_length=50, db_column="province")
    created_at = models.DateTimeField(auto_now_add=True, db_column="createdat")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedat")

    # Add once the schema gets the column described in the docstring above:
    # auth_user_id = models.IntegerField(unique=True, null=True, db_column="authuserid")

    class Meta:
        managed = False
        db_table = "provider"

    def __str__(self):
        return self.company_name


class Admin(models.Model):
    """
    Maps to the admin table. Unlike Student/Provider this has its own
    password column rather than linking to Django's auth_user -- it reads
    like a separate, simpler auth path for a small number of internal
    admin accounts rather than the token-based flow students/providers use.
    Left as a plain model for now since no admin-facing feature is being
    built yet; revisit how admin auth actually works before building one.
    """

    admin_id = models.BigAutoField(primary_key=True, db_column="adminid")
    first_name = models.CharField(max_length=50, db_column="firstname")
    last_name = models.CharField(max_length=50, db_column="lastname")
    email = models.EmailField(max_length=100, unique=True, db_column="email")
    password = models.CharField(max_length=255, db_column="password")
    role = models.CharField(max_length=30, default="moderator", db_column="role")
    is_active = models.BooleanField(default=True, db_column="isactive")
    created_at = models.DateTimeField(db_column="createdat")
    last_login_at = models.DateTimeField(null=True, blank=True, db_column="lastloginat")

    class Meta:
        managed = False
        db_table = "admin"

    def __str__(self):
        return self.email