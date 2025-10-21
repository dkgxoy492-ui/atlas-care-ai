import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LocationMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(coords);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Showing default location.",
            variant: "destructive",
          });
          // Default to a central location
          setUserLocation([0, 0]);
        }
      );
    }
  }, [toast]);

  useEffect(() => {
    if (!mapContainer.current || !userLocation) return;

    // Get Mapbox token from edge function
    const initMap = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`
        );
        const data = await response.json();
        
        if (!data.token) {
          throw new Error("No Mapbox token available");
        }

        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: userLocation,
          zoom: 13,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Add user location marker
        new mapboxgl.Marker({ color: "#3b82f6" })
          .setLngLat(userLocation)
          .setPopup(new mapboxgl.Popup().setHTML("<h3>Your Location</h3>"))
          .addTo(map.current);

        // Search for nearby pharmacies and doctors
        const searchNearby = async (query: string, color: string) => {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                query
              )}.json?proximity=${userLocation[0]},${userLocation[1]}&limit=10&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();

            data.features?.forEach((feature: any) => {
              const marker = new mapboxgl.Marker({ color })
                .setLngLat(feature.center)
                .setPopup(
                  new mapboxgl.Popup().setHTML(
                    `<h3>${feature.text}</h3><p>${feature.place_name}</p>`
                  )
                )
                .addTo(map.current!);
            });
          } catch (error) {
            console.error(`Error searching for ${query}:`, error);
          }
        };

        // Search for pharmacies (red markers)
        searchNearby("pharmacy", "#ef4444");
        
        // Search for doctors/hospitals (green markers)
        searchNearby("hospital", "#10b981");
        searchNearby("doctor", "#059669");
      } catch (error) {
        console.error("Error initializing map:", error);
        toast({
          title: "Map Error",
          description: "Unable to load the map. Please try again later.",
          variant: "destructive",
        });
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [userLocation, toast]);

  return (
    <Card className="shadow-lg border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Nearby Healthcare Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapContainer} className="w-full h-[400px] rounded-b-lg" />
        <div className="p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span>Pharmacies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>Hospitals & Doctors</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationMap;
