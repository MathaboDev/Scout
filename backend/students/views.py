from django.http import JsonResponse

def register(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST requests are allowed"},
            status=405
        )

    return JsonResponse(
        {"message": "Registration endpoint reached"},
        status=200
    )