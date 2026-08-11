from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction

from rest_framework.decorators import api_view, throttle_classes, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework import status

from .models import Student

User = get_user_model()

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def register(request):

    first_name = request.data.get("first_name")
    last_name = request.data.get("last_name")
    email = request.data.get("email")
    password = request.data.get("password")

    #========================
    #Validate required fields
    #========================

    if not first_name or not last_name or not email or not password:
        return Response(
        {
            "error": "first_name, last_name, email and password are required"
        },
        status=status.HTTP_400_BAD_REQUEST
    )

    email = email.strip().lower()

    
    #========================
    #Validate password length
    #========================

    if len(password) < 10:
        return Response(
            {
                "error": "Password must be at least 10 characters long."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

     
    #=========================
    #Check for duplicate email
    #=========================

    if User.objects.filter(username=email).exists():
        return Response(
            {
                "error": "An account with this email already exists."
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    #=========================
    #Create both records
    #=========================

    try:
        with transaction.atomic():

            #Django authenticarion account
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )

            #Scout Student record
            Student.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email,
                password_hash=make_password(password),
                is_email_verified=False,
                account_status="Active",
            )
    except Exception as error:

        return Response(
            {
                "error": "Registration failed.",
                "details": str(error),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(
        {
            "message": "Registration successful",
            "student": {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
            }
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):

    student = Student.objects.filter(
        email=request.user.email
    ).first()

    if student is None:
        return Response(
            {
                "error": "Student record not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response(
        {
            "student": {
                "student_id": student.student_id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "email": student.email,
                "is_email_verified": student.is_email_verified,
                "account_status": student.account_status,
            }
        },
        status=status.HTTP_200_OK
    )
