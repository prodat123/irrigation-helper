import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import LocationSearch from './LocationSearch';
import PlantPicker from './PlantPicker';
import WaterRequirementCalculator from './WaterRequirementCalculator';
import PlantDetails from './PlantDetails';
import StepIndicator from './StepIndicator';

// Define a component to handle routing for LocationSearch and PlantPicker
function Main() {
  const [location, setLocation] = useState(null);
  const [plants, setPlants] = useState(null);
  const { pathname } = useLocation();

  // Function to handle location updates
  const handleLocationUpdate = (newLocation) => {
    console.log(newLocation);
    setLocation(newLocation);
    localStorage.setItem('location', newLocation);
  };

  const handlePlantListUpdate = (plantList) => {
    console.log(plantList);
    setPlants(plantList);
  }

  return (
    <div className='bg-background text-text'>
      <Routes>
        <Route path="/" element={<LocationSearch onLocationUpdate={handleLocationUpdate} />} />
        <Route path="/plants" element={<PlantPicker location={location} onPlantListUpdate={handlePlantListUpdate}/>} />
        <Route path='/water-calculator' element={<WaterRequirementCalculator location={location} selectedPlants={plants} />} />
        <Route path="/plant-details" element={<PlantDetails />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Main />
    </Router>
  );
}

export default App;
