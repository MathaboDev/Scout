from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["document_id", "document_type", "file_name", "file_size", "uploaded_at", "is_active"]
        read_only_fields = fields