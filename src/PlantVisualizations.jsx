import React, { useState, useEffect } from 'react';
import { HfInference } from "@huggingface/inference";
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Modal from 'react-modal';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { TailSpin } from 'react-loader-spinner';  // Loader from react-loader-spinner

// Initialize Hugging Face inference
const inference = new HfInference("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");

// Set up the modal root element
Modal.setAppElement('#root'); // Or the ID of your root element

const localizer = momentLocalizer(moment);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Function to generate watering schedule
const generateWateringSchedule = async (totalWaterAmount, taskSize, intervalMinutes) => {
  const prompt = `Create a detailed watering schedule for a total of ${totalWaterAmount} liters of water needed for a plant. 
  Divide ${totalWaterAmount} liters into 3 tasks and schedule these tasks at intervals of at least ${intervalMinutes} in minutes. 
  For each task, provide the following information in this exact format:

  **Task X:** Y liters (HH:mm - HH:mm)
  * Timestamp: HH:mm AM/PM
  * Amount of water: Y liters (Z% of total water needed)
  * Brief explanation: [Provide a brief explanation of why this amount is needed at this time]

  Make sure to include:
  - The start and end times in 12-hour format with AM/PM
  - The amount of water in liters for each task
  - A brief explanation of the plant's watering needs at each time
  `
  const responseChunks = [];

  for await (const chunk of inference.chatCompletionStream({
    model: "meta-llama/Meta-Llama-3-8B-Instruct",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
  })) {
    responseChunks.push(chunk.choices[0]?.delta?.content || "");
  }

  const schedule = responseChunks.join("");
  console.log("Generated Schedule from AI:", schedule);
  return schedule;
};

// Helper function to convert the AI-generated schedule into events for the calendar
const parseScheduleToEvents = (scheduleText) => {
  const events = [];
  let currentEvent = {};

  const lines = scheduleText.split('\n');
  let taskStarted = false;

  lines.forEach(line => {
    const taskMatch = line.match(/\*\*Task (\d+):\*\* (.+) liters \((.+ - .+)\)/);
    if (taskMatch) {
      if (Object.keys(currentEvent).length > 0) {
        events.push(currentEvent);
      }
      currentEvent = { 
        title: `Task ${taskMatch[1]}`, 
        amount: taskMatch[2].trim(),
        start: moment(taskMatch[3].split(' - ')[0], 'h:mm A').toDate(),
        end: moment(taskMatch[3].split(' - ')[1], 'h:mm A').toDate(),
      };
      taskStarted = true;
      return;
    }

    if (taskStarted) {
      const timestampMatch = line.match(/Timestamp: (.+)/);
      if (timestampMatch) {
        currentEvent.start = moment(timestampMatch[1].trim(), 'h:mm A').toDate();
        currentEvent.end = moment(currentEvent.start).add(30, 'minutes').toDate();
      }
    }

    const amountMatch = line.match(/Amount of water: (.+) liters/);
    if (amountMatch) {
      currentEvent.amount = amountMatch[1].trim();
    }

    const explanationMatch = line.match(/Brief explanation: (.+)/);
    if (explanationMatch) {
      currentEvent.description = explanationMatch[1].trim();
    }
  });

  if (Object.keys(currentEvent).length > 0) {
    events.push(currentEvent);
  }

  console.log("Parsed Events:", events);
  return events;
};

// Function to fetch weather data
const fetchWeatherData = async (lat, lng) => {
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m`);
  const data = await response.json();
  return data;
};

const PlantVisualizations = ({ totalWaterAmount, location }) => {
  const [schedule, setSchedule] = useState(null);
  const [events, setEvents] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // console.log(location);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const taskSize = 1;
        const intervalMinutes = 60;
        const result = await generateWateringSchedule(totalWaterAmount, taskSize, intervalMinutes);
        setSchedule(result);
        const parsedEvents = parseScheduleToEvents(result);
        setEvents(parsedEvents);

        // Fetch weather data if location is available

        console.log(location);
        
        if (location !== null) {
          const latitude = location.latitude;
          const longitude = location.longitude;
          const weather = await fetchWeatherData(latitude, longitude);
          setWeatherData(weather);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (totalWaterAmount > 0) {
      fetchSchedule();
    }
  }, [totalWaterAmount, location]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: '#63a07a',
      color: 'white',
      borderRadius: '0px',
      border: 'none',
      outline: 'none',
    }
  });

  // Prepare weather chart data
  const getChartData = () => {
    if (!weatherData) return { labels: [], datasets: [] };

    const hourlyTemperatures = weatherData.hourly.temperature_2m;
    const labels = hourlyTemperatures.map((_, index) => `Hour ${index + 1}`);
    const data = hourlyTemperatures;

    return {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data,
          borderColor: '#63a07a',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 2,
          fontFamily: 'Roboto Slab'
        },
      ],
    };
  };

  return (
    <div className="mt-6">
      {/* Loading and Error Handling */}
      {loading && (
        // Display loader while loading is true
        <div className="flex flex-col items-center">
          <TailSpin height="80" width="80" color="#84bf9a" ariaLabel="loading" />
          <p>Loading visuals...</p>
        </div>
      )}
      {error && <p>Error generating watering schedule: {error.message}</p>}

      {/* Weather Chart */}
      {weatherData && (
        <div className="mt-4 p-4 bg-background border border-accent rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-primary mb-4 text-center">Weather Data</h3>
          <div style={{ position: 'relative', height: '400px' }}> {/* Set max height */}
            <Line data={getChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      )}

      {/* Watering Schedule */}
      {schedule && (
        <div className="mt-4 p-4 bg-background border border-accent rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-primary mb-4 text-center">Watering Schedule</h3>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.DAY}
            views={['day']}
            step={30}
            timeslots={2}
            style={{ height: 500, position: 'relative' }}
            onSelectEvent={handleEventClick}
            eventPropGetter={eventStyleGetter} 
            components={{
              event: ({ event }) => (
                <span>
                  <strong>{event.title}</strong>
                  <br />
                  <em>{event.description}</em>
                </span>
              ),
              
            }}
          />
        </div>
      )}

      {/* Modal for Event Details */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '600px',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }
        }}
      >
        <h2 className="text-xl font-bold mb-4 text-center">{selectedEvent?.title}</h2>
        <p><strong>Amount:</strong> {selectedEvent?.amount} liters</p>
        {console.log(selectedEvent)}
        <p><strong>Time:</strong> {selectedEvent?.start ? new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'} to {selectedEvent?.start ? new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}</p>

        <p><strong>Description:</strong> {selectedEvent?.description}</p>
        <div className='flex items-center justify-center w-full'>
        <button
          onClick={closeModal}
          className="mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-accent"
        >
          Close
        </button>
        </div>
      </Modal>
    </div>
  );
};

export default PlantVisualizations;
