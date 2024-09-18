import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import evapotranspirationData from './jsons/evapotranspiration_data_chunked.json';
import soilMoistureData from './jsons/soil_moisture_data_chunked.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faDroplet, faEdit } from '@fortawesome/free-solid-svg-icons';
import StepIndicator from './StepIndicator';

const calculateWaterRequirement = (
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

function WaterRequirementCalculator() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evapotranspiration, setEvapotranspiration] = useState(null);
  const [soilMoisture, setSoilMoisture] = useState(null);
  const [wateringAmounts, setWateringAmounts] = useState({});

  const locationData = useLocation();
  const { selectedPlants } = locationData.state;
  const location = localStorage.getItem('location').split(',');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWeather = async () => {
      if (location) {
        try {
          const lat = location[0];
          const lng = location[1];
          
          setLoading(true);
          const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: { latitude: lat, longitude: lng, hourly: 'temperature_2m' },
          });
          setWeatherData(response.data);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchWeather();

    // Set interval to update weather data every 5 minutes (300000 ms)
    const intervalId = setInterval(fetchWeather, 300000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const fetchEvapotranspirationData = () => {
      if (evapotranspirationData) {
        const latitude = location[0];
        const longitude = location[1];

        let closestPoint = null;
        let minDistance = Infinity;

        for (const item of evapotranspirationData) {
          const latDiff = Math.abs(item.lat - latitude);
          const lonDiff = Math.abs(item.lon - longitude);
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
      }
    };

    const fetchSoilMoistureData = () => {
      if (soilMoistureData) {
        const latitude = location[0];
        const longitude = location[1];

        let closestPoint = null;
        let minDistance = Infinity;

        for (const item of soilMoistureData) {
          const latDiff = Math.abs(item.lat - latitude);
          const lonDiff = Math.abs(item.lon - longitude);
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
      }
    };

    fetchEvapotranspirationData();
    fetchSoilMoistureData();
  }, [location]);

  useEffect(() => {
    if (weatherData && evapotranspiration !== null) {
      const temperatures = weatherData.hourly.temperature_2m || [];
      const averageTemperature = temperatures.reduce((acc, temp) => acc + temp, 0) / temperatures.length;

      const newWateringAmounts = {};
      selectedPlants.forEach((plant) => {
        const wateringAmount = calculateWaterRequirement(
          plant.coefficient,
          evapotranspiration,
          averageTemperature,
          8,
          soilMoisture,
          plant.targetMoisture,
        );
        newWateringAmounts[plant.name] = wateringAmount;
      });
      setWateringAmounts(newWateringAmounts);
    }
  }, [weatherData, evapotranspiration, selectedPlants]);

  // Handle click on the "See More Details" button
  const handleSeeMoreClick = (index) => {
    const plant = selectedPlants[index];
    navigate(`/plant-details?index=${index}`, { state: { plant, weatherData, plantList: selectedPlants } });
  };

  const handleGoToPlantPicker = () => {
    console.log('Selected Plants:', selectedPlants);
    navigate('/plants', {
      state: { pickedPlants: selectedPlants }
    });
  };


  return (
    <div className="p-6 bg-background min-h-screen">
      <StepIndicator />
      <h1 className="text-4xl text-center font-bold mt-4 mb-8 text-text">Figure Out Your Plant's Water Needs</h1>

      {loading && <p className="text-center text-lg text-blue-500">Fetching the latest weather data...</p>}
      {error && <p className="text-center text-lg text-red-600">Oops! Something went wrong.</p>}

      {weatherData && evapotranspiration !== null && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedPlants.map((plant, index) => (
            <div
              key={index}
              className="p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-center transform transition-transform hover:scale-105 hover:shadow-xl hover:border-accent cursor-pointer"
              onClick={() => handleSeeMoreClick(index)}
            >
              <FontAwesomeIcon icon={plant.icon} size="3x" className="text-secondary mb-4" />
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">{plant.name}</h3>
              <p className="text-gray-700 mb-2">{plant.description}</p>
              <p className="text-gray-500 mb-4">Coefficient: {plant.coefficient}</p>

              <p className="text-lg mb-4">
                <FontAwesomeIcon icon={faDroplet} className='text-blue-300'/> Estimated Watering Amount: <strong>{wateringAmounts[plant.name] || 'Calculating...'} liters per m² per day</strong>
              </p>

              <button
                onClick={() => handleSeeMoreClick(index)}
                className="mt-4 px-4 py-2 text-primary font-semibold rounded-lg hover:text-accent transition-colors"
              >
                See More Details <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          ))}
        </div>
        
      )}
      <button className='p-4 w-full bg-primary text-background mt-4 border rounded-lg text-center transform transition-transform hover:shadow-xl hover:bg-accent cursor-pointer' onClick={handleGoToPlantPicker}>Edit Plant List <FontAwesomeIcon icon={faEdit} /></button>

    </div>
  );
}

export default WaterRequirementCalculator;
