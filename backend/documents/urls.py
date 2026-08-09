from django.urls import path
from .views import DocumentUploadView, DocumentSignedURLView

urlpatterns = [
    path("documents/upload/", DocumentUploadView.as_view(), name="document-upload"),
    path("documents/<int:document_id>/url/", DocumentSignedURLView.as_view(), name="document-signed-url"),
]