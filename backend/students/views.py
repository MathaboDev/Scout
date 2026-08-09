from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

@api_view(["POST"])
@throttle_classes([AnonRateThrottle])
def register(request):
    return Response(
        {"message": "Registration endpoint reached"},
        status=200
    )