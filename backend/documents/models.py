from django.db import models


class Document(models.Model):
    """
    This class doesn't CREATE the table — it already exists, written by
    hand in schema.sql. This class just tells Django's ORM "here's how to
    talk to that existing table." That's what managed = False means below:
    Django will never try to create/alter/drop this table itself.

    db_column on each field maps the Python attribute name (left, snake_case,
    what you'll type in views.py) to the real Postgres column name (right).
    schema.sql writes columns like `DocumentID` unquoted, so Postgres folds
    them to lowercase automatically — the real column is `documentid`, not
    `DocumentID`. That's why every db_column value here is lowercase.
    """

   
    DOCUMENT_TYPES = [
        ("cv", "CV"),
        ("matric_certificate", "Matric Certificate"),
        ("academic_transcript", "Academic Transcript"),
        ("proof_of_registration", "Proof of Registration"),
        ("supporting_document", "Supporting Document"),
    ]

    document_id = models.AutoField(primary_key=True, db_column="documentid")
    student_id = models.IntegerField(db_column="studentid")
    document_type = models.CharField(max_length=50, db_column="documenttype", choices=DOCUMENT_TYPES)
    file_name = models.CharField(max_length=255, db_column="filename")
    file_url = models.CharField(max_length=500, db_column="fileurl")  # storage path, NOT a public URL
    file_size = models.IntegerField(db_column="filesize")
    uploaded_at = models.DateTimeField(auto_now_add=True, db_column="uploadedat")
    is_active = models.BooleanField(default=True, db_column="isactive")

    class Meta:
        managed = False
        db_table = "document"  # also lowercase, same folding reason as above

    def __str__(self):
        # what prints if you do print(some_document) — handy for debugging in the shell
        return f"{self.document_type} — student {self.student_id}"