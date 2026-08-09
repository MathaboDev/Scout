from django.db import models


class Document(models.Model):
    DOCUMENT_TYPES = [
        ("matric_certificate", "Matric Certificate"),
        ("academic_transcript", "Academic Transcript"),
        ("proof_of_registration", "Proof of Registration"),
    ]

    document_id = models.AutoField(primary_key=True, db_column="documentid")
    student_id = models.IntegerField(db_column="studentid")
    document_type = models.CharField(max_length=50, db_column="documenttype", choices=DOCUMENT_TYPES)
    file_name = models.CharField(max_length=255, db_column="filename")
    file_url = models.CharField(max_length=500, db_column="fileurl")
    file_size = models.IntegerField(db_column="filesize")
    uploaded_at = models.DateTimeField(auto_now_add=True, db_column="uploadedat")
    is_active = models.BooleanField(default=True, db_column="isactive")

    class Meta:
        managed = False
        db_table = "document"

    def __str__(self):
        return f"{self.document_type} — student {self.student_id}"