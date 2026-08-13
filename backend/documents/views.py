from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from core.auth_utils import get_student_id

from .models import Document
from .serializers import DocumentSerializer
from .supabase_storage import upload_document, get_signed_url, SupabaseStorageError

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
VALID_DOCUMENT_TYPES = {choice[0] for choice in Document.DOCUMENT_TYPES}


class DocumentListView(APIView):
    """
    GET /api/documents/
    Returns the authenticated student's currently active documents
    (CV, matric certificate, supporting docs).
    """

    def get(self, request):
        student_id = get_student_id(request.user)
        documents = Document.objects.filter(student_id=student_id, is_active=True)
        return Response(DocumentSerializer(documents, many=True).data)

class DocumentUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        student_id = get_student_id(request.user)

        document_type = request.data.get("document_type")
        file_obj = request.FILES.get("file")

        if not document_type or document_type not in VALID_DOCUMENT_TYPES:
            return Response({"error": f"document_type must be one of {sorted(VALID_DOCUMENT_TYPES)}"}, status=status.HTTP_400_BAD_REQUEST)

        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        ext = "." + file_obj.name.rsplit(".", 1)[-1].lower() if "." in file_obj.name else ""
        if ext not in ALLOWED_EXTENSIONS:
            return Response({"error": f"File type not allowed. Use one of {sorted(ALLOWED_EXTENSIONS)}"}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > MAX_FILE_SIZE_BYTES:
            return Response({"error": f"File exceeds {MAX_FILE_SIZE_BYTES // (1024*1024)}MB limit"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = upload_document(file_obj, student_id, document_type)
        except SupabaseStorageError as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)


        # FR1: documents "may be updated or replaced at any time" — so re-uploading
        # a matric certificate shouldn't error, it should retire the old row.
        Document.objects.filter(student_id=student_id, document_type=document_type, is_active=True).update(is_active=False)

        document = Document.objects.create(
            student_id=student_id,
            document_type=document_type,
            file_name=file_obj.name,
            file_url=result["storage_path"],
            file_size=file_obj.size,
            is_active=True,
        )

        return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)


class DocumentSignedURLView(APIView):
    """
    GET /api/documents/<id>/url/
    Returns a fresh, short-lived signed URL so the frontend can display/download
    a document. We check student_id matches before generating anything — otherwise
    student A could read student B's document just by guessing an ID.
    """

    def get(self, request, document_id):
        student_id = get_student_id(request.user)

        try:
            document = Document.objects.get(document_id=document_id, student_id=student_id)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            signed_url = get_signed_url(document.file_url)
        except SupabaseStorageError as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"signed_url": signed_url, "expires_in": 3600})

  