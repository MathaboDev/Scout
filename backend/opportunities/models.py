from django.db import models
from django.utils import timezone


class Opportunity(models.Model):
    """
    Maps to the hand-written `opportunity` table.

    Python field names here are the ones applications/views.py already
    uses (opportunity_id, provider_id, is_active, is_verified, closing_date,
    opportunity_type), so keep them stable.
    """

    opportunity_id = models.BigAutoField(primary_key=True, db_column="opportunityid")
    provider_id = models.BigIntegerField(db_column="providerid")
    admin_id = models.BigIntegerField(db_column="adminid")

    title = models.CharField(max_length=150, db_column="title")
    opportunity_type = models.CharField(max_length=100, db_column="opportunitytype")
    field_of_study = models.CharField(max_length=100, db_column="fieldofstudy")

    # Optional eligibility criteria: NULL means "no restriction".
    minimum_average = models.FloatField(null=True, blank=True, db_column="minimumaverage")
    year_level_required = models.BigIntegerField(null=True, blank=True, db_column="yearlevelrequired")
    required_qualification = models.CharField(
        max_length=50, null=True, blank=True, db_column="requiredqualification"
    )
    # 'Any' | 'Tertiary Student' | 'Graduate'
    eligibility_type = models.CharField(max_length=20, db_column="eligibilitytype")
    # NULL means nationally available
    province = models.CharField(max_length=50, null=True, blank=True, db_column="province")

    description = models.TextField(db_column="description")
    closing_date = models.DateTimeField(db_column="closingdate")
    is_verified = models.BooleanField(default=False, db_column="isverified")
    is_active = models.BooleanField(default=False, db_column="isactive")
    posted_at = models.DateTimeField(default=timezone.now, db_column="postedat")

    class Meta:
        managed = False
        db_table = "opportunity"

    def __str__(self):
        return self.title

