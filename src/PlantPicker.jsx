import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling, faThermometerHalf, faCheckCircle, faArrowDown, faArrowDown19, faArrowDownShortWide, faAngleDown, faDroplet, faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Slider from 'react-slick';
import { useLocation, useNavigate } from 'react-router-dom';
import StepIndicator from './StepIndicator';

const plants = [
  { name: 'Apple', coefficient: 0.9, icon: faSeedling, description: 'Sweet and crunchy fruit from the apple tree.', targetMoisture: 90 },
  { name: 'Carrot', coefficient: 1.1, icon: faSeedling, description: 'Orange root vegetable rich in vitamins.', targetMoisture: 110 },
  { name: 'Leafy Greens', coefficient: 1.3, icon: faSeedling, description: 'Nutrient-rich leaves like spinach and kale.', targetMoisture: 130 },
  { name: 'Hot Pepper', coefficient: 1.4, icon: faSeedling, description: 'Spicy and flavorful addition to many dishes.', targetMoisture: 140 },
  { name: 'Seedling', coefficient: 1.0, icon: faSeedling, description: 'Young plant in the early stages of growth.', targetMoisture: 100 },
  { name: 'Tree', coefficient: 0.7, icon: faSeedling, description: 'Large, woody plant with a trunk and branches.', targetMoisture: 70 },
  { name: 'Corn', coefficient: 1.2, icon: faSeedling, description: 'Versatile grain used in many culinary dishes.', targetMoisture: 120 },
  { name: 'Grapes', coefficient: 0.8, icon: faSeedling, description: 'Juicy, sweet berries often used for wine.', targetMoisture: 80 },
  { name: 'Lemon', coefficient: 1.1, icon: faSeedling, description: 'Tart fruit perfect for adding flavor to dishes.', targetMoisture: 110 },
  { name: 'Olive', coefficient: 0.9, icon: faSeedling, description: 'Small fruit used to make olive oil.', targetMoisture: 90 },
  { name: 'Pineapple', coefficient: 1.3, icon: faSeedling, description: 'Tropical fruit with a sweet, tangy taste.', targetMoisture: 130 },
  { name: 'Strawberry', coefficient: 1.2, icon: faSeedling, description: 'Sweet, red fruit perfect for desserts.', targetMoisture: 120 },
  { name: 'Watermelon', coefficient: 1.5, icon: faSeedling, description: 'Refreshing fruit with a high water content.', targetMoisture: 150 },
  { name: 'Sunflower', coefficient: 1.0, icon: faSeedling, description: 'Bright, cheerful flower with edible seeds.', targetMoisture: 100 },
  { name: 'Cactus', coefficient: 0.6, icon: faSeedling, description: 'Drought-resistant plant with spiky exterior.', targetMoisture: 60 },
  { name: 'Cherry', coefficient: 1.1, icon: faSeedling, description: 'Small, red fruit with a sweet flavor.', targetMoisture: 110 },
  { name: 'Gingerbread Man', coefficient: 0.8, icon: faSeedling, description: 'Sweet and spicy treat often enjoyed during holidays.', targetMoisture: 80 },
  { name: 'Holly Berry', coefficient: 0.7, icon: faSeedling, description: 'Red berries from the holly plant, festive and bright.', targetMoisture: 70 },
  { name: 'Mango', coefficient: 1.3, icon: faSeedling, description: 'Tropical fruit with a sweet and juicy flavor.', targetMoisture: 130 },
  { name: 'Pawpaw', coefficient: 1.2, icon: faSeedling, description: 'Tropical fruit with a custard-like texture.', targetMoisture: 120 },
  { name: 'Peach', coefficient: 1.0, icon: faSeedling, description: 'Sweet, fuzzy fruit perfect for summer treats.', targetMoisture: 100 },
  { name: 'Pinecone', coefficient: 0.8, icon: faSeedling, description: 'Seed-bearing structure of pine trees.', targetMoisture: 80 },
  { name: 'Pumpkin', coefficient: 1.1, icon: faSeedling, description: 'Orange gourd used in pies and decorations.', targetMoisture: 110 },
  { name: 'Rose', coefficient: 0.9, icon: faSeedling, description: 'Beautiful flower known for its fragrant blooms.', targetMoisture: 90 },
  { name: 'Square', coefficient: 0.7, icon: faSeedling, description: 'Symbol representing a perfect geometric shape.', targetMoisture: 70 },
  { name: 'Sprout', coefficient: 1.0, icon: faSeedling, description: 'Young plant beginning its growth journey.', targetMoisture: 100 },
  { name: 'Tomato', coefficient: 1.2, icon: faSeedling, description: 'Juicy fruit used in salads and sauces.', targetMoisture: 120 },
  { name: 'Wheat', coefficient: 1.4, icon: faSeedling, description: 'Staple grain used to make bread and pasta.', targetMoisture: 140 },
  { name: 'Zucchini', coefficient: 1.0, icon: faSeedling, description: 'Versatile summer squash often used in cooking.', targetMoisture: 100 },
  { name: 'Cabbage', coefficient: 1.1, icon: faSeedling, description: 'Leafy vegetable with a crisp texture.', targetMoisture: 110 },
  { name: 'Bamboo', coefficient: 0.8, icon: faSeedling, description: 'Fast-growing plant used in construction and crafts.', targetMoisture: 80 },
  { name: 'Blueberry', coefficient: 1.3, icon: faSeedling, description: 'Small, sweet berry rich in antioxidants.', targetMoisture: 130 },
  { name: 'Broccoli', coefficient: 1.2, icon: faSeedling, description: 'Cruciferous vegetable packed with nutrients.', targetMoisture: 120 },
  { name: 'Cauliflower', coefficient: 1.1, icon: faSeedling, description: 'Versatile vegetable often used as a low-carb substitute.', targetMoisture: 110 },
  { name: 'Chili Pepper', coefficient: 1.4, icon: faSeedling, description: 'Hot pepper adding spice to dishes.', targetMoisture: 140 },
  { name: 'Cucumber', coefficient: 1.0, icon: faSeedling, description: 'Refreshing vegetable used in salads and pickles.', targetMoisture: 100 },
  { name: 'Date', coefficient: 1.2, icon: faSeedling, description: 'Sweet fruit often used in desserts and snacks.', targetMoisture: 120 },
  { name: 'Fig', coefficient: 1.3, icon: faSeedling, description: 'Sweet fruit with a unique texture and flavor.', targetMoisture: 130 },
  { name: 'Garlic', coefficient: 1.1, icon: faSeedling, description: 'Strongly flavored bulb used to enhance many dishes.', targetMoisture: 110 },
  { name: 'Kale', coefficient: 1.2, icon: faSeedling, description: 'Leafy green vegetable packed with nutrients.', targetMoisture: 120 },
  { name: 'Lettuce', coefficient: 1.0, icon: faSeedling, description: 'Crisp vegetable used in salads and sandwiches.', targetMoisture: 100 },
  { name: 'Mushroom', coefficient: 1.1, icon: faSeedling, description: 'Fungi used in a variety of culinary dishes.', targetMoisture: 110 },
  { name: 'Onion', coefficient: 1.2, icon: faSeedling, description: 'Pungent vegetable used to flavor many dishes.', targetMoisture: 120 },
  { name: 'Papaya', coefficient: 1.3, icon: faSeedling, description: 'Sweet tropical fruit with a soft texture.', targetMoisture: 130 },
  { name: 'Radish', coefficient: 1.1, icon: faSeedling, description: 'Crisp root vegetable with a peppery flavor.', targetMoisture: 110 },
  { name: 'Raspberry', coefficient: 1.2, icon: faSeedling, description: 'Juicy, red berry often used in desserts.', targetMoisture: 120 },
  { name: 'Sweet Potato', coefficient: 1.3, icon: faSeedling, description: 'Sweet, starchy root vegetable rich in vitamins.', targetMoisture: 130 },
  { name: 'Tangerine', coefficient: 1.0, icon: faSeedling, description: 'Sweet and tangy citrus fruit.', targetMoisture: 100 }
];


  
function PlantPicker({ location, onPlantListUpdate }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlants, setFilteredPlants] = useState(plants);
  const [visibleCount, setVisibleCount] = useState(8); // Number of visible plants
  const navigate = useNavigate();
  const locationData = useLocation();
  const { pickedPlants } = locationData.state || {};


  useEffect(() => {
    if(pickedPlants !== undefined){
      setSelectedPlants(pickedPlants);
    }
  }, [pickedPlants])
  


  useEffect(() => {
    if (location) {
      const lat = location[0];
      const lng = location[1];
      const fetchWeather = async () => {
        try {
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
      };
      fetchWeather();
    }
  }, [location]);

  const handleSelectPlant = (plant) => {
    setSelectedPlants((prevSelectedPlants) => {
      const isAlreadySelected = prevSelectedPlants.some((selected) => selected.name === plant.name);

      if (isAlreadySelected) {
        return prevSelectedPlants.filter((selected) => selected.name !== plant.name);
      } else {
        return [...prevSelectedPlants, plant];
      }
    });
  };

  useEffect(() => {
    setFilteredPlants(
      plants.filter((plant) =>
        plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  const handleNextPage = () => {
    if(selectedPlants.length > 0){
      onPlantListUpdate(selectedPlants);
      navigate('/water-calculator', {
        state: { location: location, selectedPlants: selectedPlants }
      });
    }else{
      alert("Pick at least one plant before moving on!");
    }
    
  };

  const handlePrevPage = () => {    
    navigate('/');
  };

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + 8); // Load 8 more plants
  };

  return (
    <div className='min-h-screen p-6'>
      <StepIndicator />
      <h1 className='text-4xl text-center font-bold mt-3 mb-6'>Pick Your Plants</h1>

      <p className='text-center font-semibold text-xl'>(Select plants you want to farm by clicking on them)</p>
      <div className='my-6'>
        <input
          type='text'
          className='p-2 border border-gray-300 rounded mb-4 w-full focus:outline-accent'
          placeholder='Search for plants...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
        {filteredPlants.slice(0, visibleCount).map((plant) => (
          <div
            key={plant.name}
            className={`relative p-4 border rounded-lg shadow-md cursor-pointer text-center 
              ${selectedPlants.some((selected) => selected.name === plant.name) ? 'border-primary' : ''}`}
            onClick={() => handleSelectPlant(plant)}
          >
            {selectedPlants.some((selected) => selected.name === plant.name) && (
              <FontAwesomeIcon
                icon={faCheckCircle}
                size='2x'
                className='absolute top-0 right-0 m-2 text-primary'
              />
            )}
            <FontAwesomeIcon icon={plant.icon} size='3x' className='mb-2 text-secondary' />
            <h3 className='text-xl font-bold'>{plant.name}</h3>
            <p className='text-md'>Water coefficient: {plant.coefficient}</p>
            <p className='text-sm text-gray-500'>{plant.description}</p>
          </div>
        ))}
      </div>

      {filteredPlants.length > visibleCount && (
        <div className='mt-6 text-center'>
          <button
            className='px-4 py-2 text-primary font-semibold rounded'
            onClick={handleLoadMore}
          >
            Load More <FontAwesomeIcon icon={faAngleDown} />
          </button>
        </div>
      )}

      <div className='mt-6 text-center'>
        <button
          className='px-4 py-2 bg-primary text-white rounded'
          onClick={handleNextPage}
        >
          Start Watering <FontAwesomeIcon icon={faDroplet} />
        </button>
      </div>

      <button className='text-2xl absolute top-6' onClick={handlePrevPage}><FontAwesomeIcon icon={faAngleLeft} /></button>
    </div>
  );
}

export default PlantPicker;