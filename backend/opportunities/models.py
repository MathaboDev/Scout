from django.db import models


class Opportunity(models.Model):
    """
    Corrected against the real schema.sql. One thing to flag:

    is_active defaults to False and is_verified exists separately. That
       reads as: a provider posts a listing, it sits inactive/unverified
       until something (presumably an admin action, given adminid is
       required) flips both flags, and only then does it reach students.
       Until the admin side exists, you'll need to set both to True by
       hand on any row you want Browse to actually return.
    """

    opportunity_id = models.BigAutoField(primary_key=True, db_column="opportunityid")
    provider_id = models.BigIntegerField(db_column="providerid")
    admin_id = models.BigIntegerField(db_column="adminid")

    title = models.CharField(max_length=150, db_column="title")
    opportunity_type = models.CharField(max_length=100, db_column="opportunitytype")
    field_of_study = models.CharField(max_length=100, db_column="fieldofstudy")  # required, not optional

    # Optional eligibility criteria -- NULL means no restriction.
    minimum_average = models.FloatField(null=True, blank=True, db_column="minimumaverage")
    year_level_required = models.BigIntegerField(null=True, blank=True, db_column="yearlevelrequired")
    required_qualification = models.CharField(max_length=50, null=True, blank=True, db_column="requiredqualification")
    province = models.CharField(max_length=50, null=True, blank=True, db_column="province")

    # Restricts a listing to one student type. "Both" is the default a
    # provider gets if they don't explicitly choose Tertiary Student or
    # Graduate, so eligibilitytype's NOT NULL constraint is always satisfied
    # without forcing every provider to make a choice.
    ELIGIBILITY_TYPE_CHOICES = [
        ("Tertiary Student", "Tertiary Student"),
        ("Graduate", "Graduate"),
        ("Both", "Both"),
    ]
    eligibility_type = models.CharField(
        max_length=20, default="Both", choices=ELIGIBILITY_TYPE_CHOICES, db_column="eligibilitytype"
    )

    description = models.TextField(db_column="description")
    closing_date = models.DateTimeField(db_column="closingdate")
    is_verified = models.BooleanField(default=False, db_column="isverified")
    is_active = models.BooleanField(default=False, db_column="isactive")
    posted_at = models.DateTimeField(auto_now_add=True, db_column="postedat")

    class Meta:
        managed = False
        db_table = "opportunity"

    def __str__(self):
        return f"{self.title} (provider {self.provider_id})"