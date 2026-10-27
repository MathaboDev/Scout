from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.permissions import IsStudent

from .models import Notification


def _payload(n):
    return {
        "notification_id": n.notification_id,
        "notification_type": n.notification_type,
        "message": n.message,
        "is_read": n.is_read,
        "sent_at": n.sent_at,
        "application_id": n.application_id,
        "bookmark_id": n.bookmark_id,
    }


@api_view(["GET"])
@permission_classes([IsStudent])
def list_notifications(request):
    """GET /api/notifications/ -> latest 30 in-app notifications + unread count"""
    qs = Notification.objects.filter(student_id=request.student.student_id, channel="in_app")
    return Response(
        {
            "unread_count": qs.filter(is_read=False).count(),
            "results": [_payload(n) for n in qs.order_by("-sent_at")[:30]],
        }
    )


@api_view(["POST"])
@permission_classes([IsStudent])
def mark_read(request, notification_id):
    Notification.objects.filter(
        notification_id=notification_id, student_id=request.student.student_id
    ).update(is_read=True)
    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([IsStudent])
def mark_all_read(request):
    Notification.objects.filter(
        student_id=request.student.student_id, channel="in_app", is_read=False
    ).update(is_read=True)
    return Response({"ok": True})

