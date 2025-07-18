import math
from service_booking.apps.accounts.models import ProviderProfile
from django.db.models import Q

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_top_providers(category, user_location, required_skills=None, time=None):
    lat, lon = user_location['latitude'], user_location['longitude']
    qs = ProviderProfile.objects.filter(
        category=category,
        is_available=True,
        is_approved=True,
        rating__gte=3.0  # Example threshold
    )
    if required_skills:
        for skill in required_skills:
            qs = qs.filter(skills__icontains=skill)
    # Filter by availability at requested time if provided
    # (Assume availability is a dict: {'Monday': [{'from': '10:00', 'to': '18:00'}]})
    # ... (add time filtering logic here if needed) ...
    providers = []
    for p in qs:
        p_lat, p_lon = p.location.get('latitude'), p.location.get('longitude')
        distance = haversine(lat, lon, p_lat, p_lon)
        providers.append({
            'provider': p,
            'distance': distance,
            'rating': p.rating,
            'last_active': p.last_active
        })
    # Sort by distance, then rating, then last_active
    providers.sort(key=lambda x: (x['distance'], -x['rating'], -x['last_active'].timestamp()))
    return [dict(provider=x['provider'], distance=x['distance']) for x in providers[:5]]
