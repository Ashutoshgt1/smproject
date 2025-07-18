from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, ComplaintViewSet

router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'complaints', ComplaintViewSet, basename='complaint')

urlpatterns = router.urls 