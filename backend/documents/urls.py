from django.urls import path
from .views import DocumentUploadView, DocumentSignedURLView, DocumentListView

urlpatterns = [
    path("documents/upload/", DocumentUploadView.as_view(), name="document-upload"),
    path("documents/", DocumentListView.as_view(), name="document-list"),
    path("documents/<int:document_id>/url/", DocumentSignedURLView.as_view(), name="document-signed-url"),
]