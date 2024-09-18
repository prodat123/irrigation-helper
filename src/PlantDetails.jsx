import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import evapotranspirationData from './jsons/evapotranspiration_data_chunked.json'; // Adjust path as needed
import soilMoistureData from './jsons/soil_moisture_data_chunked.json'; // Adjust path as needed
import PlantVisualizations from './PlantVisualizations'; // Import the component
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import StepIndicator from './StepIndicator';

// Configure Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const calculateWateringAmount = (
  plantCoefficient = 1,
  evapotranspirationTotal = 30,
  temperature = 30,
  days = 8,
  currentSoilMoisture = 20,
  targetMoisture = 40
) => {
  const baseTemperature = 20;
  const temperatureFactor = 1 + 0.01 * (temperature - baseTemperature);
  const dailyEvapotranspiration = evapotranspirationTotal / days;
  const adjustedEvapotranspiration = dailyEvapotranspiration * temperatureFactor;
  const moistureDeficit = Math.max(0, targetMoisture - currentSoilMoisture) / 100;
  const waterRequirement = adjustedEvapotranspiration * plantCoefficient * moistureDeficit;
  return waterRequirement.toFixed(2); // Amount in liters per m²
};

const PlantDetails = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Used to navigate between different plants

  // Extracting state from the location object
  const [searchParams] = useSearchParams(); // Get the search params object
  const index = searchParams.get('index');  // Retrieve 'index' from search params
  const { weatherData, plantList = [] } = location.state || {};
  const [currentPlantIndex, setCurrentPlantIndex] = useState(parseInt(index, 10));
  const currentPlant = plantList[currentPlantIndex] || {};
  const [evapotranspiration, setEvapotranspiration] = useState(null);
  const [soilMoisture, setSoilMoisture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const plantLocation = localStorage.getItem('location').split(',');
  const latitude = plantLocation[0];
  const longitude = plantLocation[1];

  const roundCoordinate = (value, decimalPlaces = 2) => parseFloat(value).toFixed(decimalPlaces);

  useEffect(() => {
    const fetchEvapotranspirationData = () => {
      if (evapotranspirationData) {
        const roundedLat = roundCoordinate(latitude);
        const roundedLon = roundCoordinate(longitude);

        let closestPoint = null;
        let minDistance = Infinity;

        for (const item of evapotranspirationData) {
          const latDiff = Math.abs(roundCoordinate(item.lat) - roundedLat);
          const lonDiff = Math.abs(roundCoordinate(item.lon) - roundedLon);
          const distance = Math.sqrt(latDiff ** 2 + lonDiff ** 2);

          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = item;
          }
        }

        if (closestPoint) {
          setEvapotranspiration(closestPoint.evapotranspiration);
        } else {
          setEvapotranspiration(null);
        }

        setLoading(false);
      } else {
        setError("Failed to load evapotranspiration data.");
        setLoading(false);
      }
    };

    const fetchSoilMoistureData = () => {
      if (soilMoistureData) {
        const roundedLat = roundCoordinate(latitude);
        const roundedLon = roundCoordinate(longitude);

        let closestPoint = null;
        let minDistance = Infinity;

        for (const item of soilMoistureData) {
          const latDiff = Math.abs(roundCoordinate(item.lat) - roundedLat);
          const lonDiff = Math.abs(roundCoordinate(item.lon) - roundedLon);
          const distance = Math.sqrt(latDiff ** 2 + lonDiff ** 2);

          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = item;
          }
        }

        if (closestPoint) {
          setSoilMoisture(closestPoint.moisture);
        } else {
          setSoilMoisture(null);
        }

        setLoading(false);
      } else {
        setError("Failed to load soil moisture data.");
        setLoading(false);
      }
    };

    fetchEvapotranspirationData();
    fetchSoilMoistureData();
  }, [latitude, longitude]);

  const temperatures = weatherData?.hourly?.temperature_2m || [];
  const averageTemperature = temperatures.reduce((acc, temp) => acc + temp, 0) / temperatures.length;
  const temperature = averageTemperature;

  
  const handleGoToList = () => {
    navigate('/water-calculator', {
      state: { location: [latitude, longitude], selectedPlants: plantList }
    });
  };

  const handleNextPlant = () => {
    const nextIndex = parseInt(currentPlantIndex, 10) + 1;
    console.log("This is the next index: " + nextIndex);
  
    if (nextIndex < plantList.length) {
      setCurrentPlantIndex(nextIndex);
      navigate(`/plant-details?index=${nextIndex}`, { state: { weatherData, plantList } });
      window.location.reload();
    }
  };
  

  const handlePrevPlant = () => {
    const prevIndex = parseInt(currentPlantIndex, 10) - 1;
    if (prevIndex >= 0) {
      setCurrentPlantIndex(prevIndex);
      navigate(`/plant-details?index=${prevIndex}`, { state: { weatherData, plantList } });
      window.location.reload();
    }
  };

  let evapotranspirationTotal;
  let wateringAmount;
  if (evapotranspiration !== null) {
    evapotranspirationTotal = evapotranspiration;
    wateringAmount = calculateWateringAmount(
      currentPlant.coefficient,
      evapotranspirationTotal,
      temperature,
      8,
      soilMoisture,
      currentPlant.targetMoisture
    );
  }

  if (loading) {
    return <div className="text-center text-lg">Loading plant details...</div>;
  }

  if (error) {
    return <div className="text-center text-lg text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <StepIndicator />

      <h1 className="text-4xl font-bold mt-4 mb-6 text-center text-primary">
        {currentPlant.name} Watering Details
      </h1>

      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <MapContainer center={[latitude, longitude]} zoom={13} className="h-96 min-w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[latitude, longitude]} />
        </MapContainer>

        <h2 className="text-2xl font-semibold my-4">Plant & Environmental Information</h2>
        <p className="text-lg mb-2"><strong>Coefficient:</strong> {currentPlant.coefficient}</p>
        <p className="text-lg mb-2"><strong>Description:</strong> {currentPlant.description}</p>
        <p className="text-lg mb-2"><strong>Evapotranspiration:</strong> {evapotranspiration} mm for 8 days</p>
        <p className="text-lg mb-4"><strong>Soil Moisture:</strong> {soilMoisture}%</p>

        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Estimated Watering Amount</h2>
          <p className="text-lg">
            Based on the current conditions, the estimated watering amount is{' '}
            <strong>{wateringAmount} liters per m² today</strong>.
          </p>
        </div>

        <div className="mt-6">
          <PlantVisualizations totalWaterAmount={wateringAmount} location={weatherData} />
        </div>

        {/* Navigation Arrows */}
        <div className="flex justify-between items-center mt-8">
          <button
            className="bg-primary text-white py-2 px-4 rounded disabled:bg-gray-400 hover:bg-accent"
            onClick={handlePrevPlant}
            disabled={currentPlantIndex === 0}
          >
            ← Previous Plant
          </button>
          <button
            className="bg-primary text-white py-2 px-4 rounded disabled:bg-gray-400 hover:bg-accent"
            onClick={handleGoToList}
          >
            Back to Plant List
          </button>
          <button
            className="bg-primary text-white py-2 px-4 rounded disabled:bg-gray-400 hover:bg-accent"
            onClick={handleNextPlant}
            disabled={currentPlantIndex === plantList.length - 1}
          >
            Next Plant →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantDetails;
