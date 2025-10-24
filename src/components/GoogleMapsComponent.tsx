import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const GoogleMapsComponent = () => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        toast({
          title: "Location Error",
          description: "Unable to get your location",
          variant: "destructive",
        });
        setUserLocation({ lat: 0, lng: 0 });
      }
    );
  }, [toast]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps API script if not already loaded
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    
    if (existingScript) {
      existingScript.addEventListener('load', initializeMap);
      return;
    }

    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      toast({
        title: "Configuration Error",
        description: "Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.",
        variant: "destructive",
      });
      return;
    }
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    
    document.head.appendChild(script);

    function initializeMap() {
      if (!mapRef.current || !window.google) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.HYBRID,
          ],
        },
      });

      setMap(mapInstance);

      // User location marker
      new google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: t('map.userLocation'),
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Search for nearby medical facilities
      const service = new google.maps.places.PlacesService(mapInstance);

      // Search for pharmacies
      service.nearbySearch(
        {
          location: userLocation,
          radius: 5000,
          type: "pharmacy",
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.slice(0, 5).forEach((place) => {
              if (place.geometry?.location) {
                const marker = new google.maps.Marker({
                  position: place.geometry.location,
                  map: mapInstance,
                  title: place.name,
                  icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  },
                });

                const infoWindow = new google.maps.InfoWindow({
                  content: `
                    <div style="padding: 8px;">
                      <h3 style="font-weight: bold; margin-bottom: 4px;">${place.name}</h3>
                      <p style="margin: 4px 0;">${place.vicinity}</p>
                      ${place.rating ? `<p style="margin: 4px 0;">Rating: ${place.rating} ⭐</p>` : ''}
                      <a href="https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}" target="_blank" style="color: #4285F4; text-decoration: underline;">Get Directions</a>
                    </div>
                  `,
                });

                marker.addListener("click", () => {
                  infoWindow.open(mapInstance, marker);
                });
              }
            });
          }
        }
      );

      // Search for hospitals
      service.nearbySearch(
        {
          location: userLocation,
          radius: 5000,
          type: "hospital",
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.slice(0, 5).forEach((place) => {
              if (place.geometry?.location) {
                const marker = new google.maps.Marker({
                  position: place.geometry.location,
                  map: mapInstance,
                  title: place.name,
                  icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  },
                });

                const infoWindow = new google.maps.InfoWindow({
                  content: `
                    <div style="padding: 8px;">
                      <h3 style="font-weight: bold; margin-bottom: 4px;">${place.name}</h3>
                      <p style="margin: 4px 0;">${place.vicinity}</p>
                      ${place.rating ? `<p style="margin: 4px 0;">Rating: ${place.rating} ⭐</p>` : ''}
                      <a href="https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}" target="_blank" style="color: #4285F4; text-decoration: underline;">Get Directions</a>
                    </div>
                  `,
                });

                marker.addListener("click", () => {
                  infoWindow.open(mapInstance, marker);
                });
              }
            });
          }
        }
      );
    }
  }, [userLocation, t]);

  return (
    <Card className="shadow-lg border-border">
      <CardHeader>
        <CardTitle>{t('map.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="w-full h-[500px] rounded-lg" />
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>{t('map.userLocation')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>{t('map.pharmacies')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span>{t('map.hospitals')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleMapsComponent;
