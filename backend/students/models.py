from django.db import models


class Student(models.Model):
    studentid = models.AutoField(primary_key=True, db_column="studentid")
    firstname = models.CharField(max_length=50, db_column="firstname")
    lastname = models.CharField(max_length=50, db_column="lastname")
    email = models.EmailField(max_length=100, unique=True, db_column="email")
    passwordhash = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column="passwordhash",
    )
    authuserid = models.IntegerField(
        unique=True,
        null=True,
        blank=True,
        db_column="authuserid",
    )
    isemailverified = models.BooleanField(
        default=False,
        db_column="isemailverified",
    )
    accountstatus = models.CharField(
        max_length=20,
        default="Active",
        db_column="accountstatus",
    )
    createdat = models.DateTimeField(
        auto_now_add=True,
        db_column="createdat",
    )
    updatedat = models.DateTimeField(
        auto_now=True,
        db_column="updatedat",
    )

    class Meta:
        managed = False
        db_table = "student"

    def __str__(self):
        return f"{self.firstname} {self.lastname}"


class Profile(models.Model):
    profileid = models.AutoField(primary_key=True, db_column="profileid")
    studentid = models.OneToOneField(
        Student,
        on_delete=models.DO_NOTHING,
        db_column="studentid",
        related_name="profile",
    )
    institution = models.CharField(
        max_length=100,
        db_column="institution",
    )
    fieldofstudy = models.CharField(
        max_length=100,
        db_column="fieldofstudy",
    )
    yearlevel = models.IntegerField(db_column="yearlevel")
    academicaverage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        db_column="academicaverage",
    )
    opportunitypreference = models.CharField(
        max_length=50,
        db_column="opportunitypreference",
    )
    province = models.CharField(
        max_length=50,
        db_column="province",
    )
    createdat = models.DateTimeField(
        auto_now_add=True,
        db_column="createdat",
    )
    updatedat = models.DateTimeField(
        auto_now=True,
        db_column="updatedat",
    )

    class Meta:
        managed = False
        db_table = "profile"

    def __str__(self):
        return f"Profile {self.profileid}"