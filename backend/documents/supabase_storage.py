import os
import uuid
import requests
from django.conf import settings


class SupabaseStorageError(Exception):
    pass


def _headers():
    return {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_KEY,
    }


def upload_document(file_obj, student_id: int, document_type: str) -> dict:
    ext = os.path.splitext(file_obj.name)[1].lower()
    storage_path = f"student_{student_id}/{document_type}_{uuid.uuid4().hex[:8]}{ext}"

    url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_BUCKET}/{storage_path}"
    headers = _headers()
    headers["Content-Type"] = file_obj.content_type or "application/octet-stream"
    headers["x-upsert"] = "true"

    try:
        response = requests.post(url, headers=headers, data=file_obj.read(), timeout=10)
    except requests.exceptions.RequestException as e:
        raise SupabaseStorageError(f"Could not reach Supabase Storage: {e}")

    if response.status_code not in (200, 201):
        raise SupabaseStorageError(f"Upload failed: {response.status_code} {response.text}")

    return {"storage_path": storage_path}


def get_signed_url(storage_path: str, expires_in: int = 3600) -> str:
    url = f"{settings.SUPABASE_URL}/storage/v1/object/sign/{settings.SUPABASE_BUCKET}/{storage_path}"

    try:
        response = requests.post(url, headers=_headers(), json={"expiresIn": expires_in}, timeout=10)
    except requests.exceptions.RequestException as e:
        raise SupabaseStorageError(f"Could not reach Supabase Storage: {e}")

    if response.status_code != 200:
        raise SupabaseStorageError(f"Signed URL failed: {response.status_code} {response.text}")

    signed_path = response.json()["signedURL"]
    return f"{settings.SUPABASE_URL}/storage/v1{signed_path}"


def delete_document(storage_path: str) -> None:
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_BUCKET}/{storage_path}"

    try:
        response = requests.delete(url, headers=_headers(), timeout=10)
    except requests.exceptions.RequestException as e:
        raise SupabaseStorageError(f"Could not reach Supabase Storage: {e}")

    if response.status_code not in (200, 204):
        raise SupabaseStorageError(f"Delete failed: {response.status_code} {response.text}")