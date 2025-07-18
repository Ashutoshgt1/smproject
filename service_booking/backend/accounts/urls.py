from rest_framework.routers import DefaultRouter
from .views import AddressViewSet
from django.urls import path
from .views import RegisterView, current_user

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = router.urls + [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', current_user, name='current_user'),
] 