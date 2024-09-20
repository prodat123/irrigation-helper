import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import StepIndicator from "./StepIndicator";

// Fix missing marker icon issue in Leaflet.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const LocationSearch = ({ onLocationUpdate }) => {
  const [markerPosition, setMarkerPosition] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  const MapHandler = () => {
    const map = useMap(); 

    useEffect(() => {
      if (map && markerPosition) {
        map.flyTo(markerPosition, 13, {
          duration: 1 
        });
      }
    }, [markerPosition, map]);

    return null;
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const newPosition = [e.latlng.lat, e.latlng.lng];
        setMarkerPosition(newPosition);
        onLocationUpdate(newPosition); 
      },
    });
    return null;
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!inputValue) return;

    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: inputValue,
          format: "json",
          limit: 5,
        },
      });

      const data = response.data;
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newPosition = [parseFloat(lat), parseFloat(lon)]; 
        setMarkerPosition(newPosition);
        onLocationUpdate(newPosition); 
      } else {
        alert("Location not found");
      }
    } catch (error) {
      console.error("Error fetching suggestions", error);
    }
  };

  const handleSuggestionClick = (lat, lon) => {
    const newPosition = [parseFloat(lat), parseFloat(lon)];
    setMarkerPosition(newPosition);
    setSuggestions([]);
    setInputValue("");
    onLocationUpdate(newPosition);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = [parseFloat(latitude), parseFloat(longitude)]; 
          setUserLocation(newPosition);
          setMarkerPosition(newPosition); 
          onLocationUpdate(newPosition); 
        },
        (error) => {
          console.error("Error getting current location", error);
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    getCurrentLocation(); 
  }, []);

  useEffect(() => {
    if (inputValue) {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
              q: inputValue,
              format: "json",
              limit: 5,
            },
          });

          const data = response.data;
          setSuggestions(data);
        } catch (error) {
          console.error("Error fetching suggestions", error);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [inputValue]);

  const handleNavigateToPlantPicker = () => {
    if (markerPosition) {
      navigate('/plants'); 
    } else {
      alert("Please select a location on the map.");
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col items-center justify-center">
      <h1 className='text-6xl font-bold text-center mb-4 text-primary'>Irrigation Helper</h1>
      <StepIndicator />
      <h1 className='text-2xl font-semibold text-center text-text my-4'>Pick a Location for Planting</h1>
      {/* Centered Input */}
      <div className="relative max-w-4xl w-full p-4 mb-4 text-center text-lg border rounded-lg shadow-lg">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search location here"
            className="w-full p-2 border rounded-lg focus:outline-accent"
          />
        </form>
        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-lg mt-2 z-50">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion.lat, suggestion.lon)}
                className="p-2 cursor-pointer hover:bg-gray-200"
              >
                {suggestion.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p>- Or -</p>
      <p className="mb-3 font-semibold">Click on your location</p>
      {/* Leaflet Map */}
      {userLocation ? (
        <div className="max-w-4xl w-full h-2/3 z-10">
          <MapContainer
            center={userLocation || [51.505, -0.09]} // Default center if userLocation is not yet set
            zoom={13}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapHandler />
            <MapClickHandler />
            {markerPosition && <Marker position={markerPosition} />}
          </MapContainer>
        </div>
      ) : (
        <></>
      )}
      <button
        className="max-w-2xl w-full rounded-lg bg-primary px-4 py-2 mt-4 text-background hover:bg-accent duration-200 transition font-semibold"
        onClick={handleNavigateToPlantPicker}
      >
        Planting Time <FontAwesomeIcon icon={faLeaf} />
      </button> 
    </div>
  );
};

export default LocationSearch;
