// OpenWeatherMap API configuration
const API_KEY = '4d8fb5b93d4af21d66a2948710284366'; // Updated API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const temperature = document.querySelector('.temperature');
    const date = document.querySelector('.date');
    const weatherCondition = document.querySelector('.weather-condition');
    const locationElement = document.querySelector('.location');
    const forecastContainer = document.querySelector('.forecast-container');
    const uvIndex = document.querySelector('.uv-index');
    const windSpeed = document.querySelector('.wind-speed');
    const windDirection = document.querySelector('.wind-direction');
    const humidity = document.querySelector('.humidity span');
    const humidityStatus = document.querySelector('.humidity-status');

    // Verify all elements are found
    if (!searchInput || !searchBtn || !temperature || !date || !weatherCondition || 
        !locationElement || !forecastContainer || !uvIndex || !windSpeed || 
        !windDirection || !humidity || !humidityStatus) {
        console.error('Some DOM elements could not be found');
        return;
    }

    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    function handleSearch() {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }

    // Fetch weather data
    async function getWeatherData(city) {
        try {
            // Show loading state
            showLoadingState();

            // Get current weather
            const weatherUrl = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
            const weatherResponse = await fetch(weatherUrl);
            
            if (!weatherResponse.ok) {
                if (weatherResponse.status === 404) {
                    throw new Error('City not found. Please check the spelling and try again.');
                } else if (weatherResponse.status === 401) {
                    throw new Error('API key error. Please try again later.');
                } else {
                    throw new Error('Error fetching weather data. Please try again.');
                }
            }
            
            const weatherData = await weatherResponse.json();

            // Get forecast data
            const forecastUrl = `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
            const forecastResponse = await fetch(forecastUrl);
            
            if (!forecastResponse.ok) {
                throw new Error('Error fetching forecast data');
            }
            
            const forecastData = await forecastResponse.json();

            // Update UI with fetched data
            updateWeatherUI(weatherData);
            updateForecastUI(forecastData);

            // Clear input after successful search
            searchInput.value = '';
            
        } catch (error) {
            console.error('Error:', error.message);
            showErrorState(error.message);
        }
    }

    function showLoadingState() {
        temperature.textContent = 'Loading...';
        weatherCondition.textContent = 'Fetching weather data...';
        locationElement.textContent = 'Please wait...';
        forecastContainer.innerHTML = '';
        uvIndex.textContent = '--';
        windSpeed.textContent = '--';
        windDirection.textContent = '--';
        humidity.textContent = '--%';
        humidityStatus.textContent = '--';
    }

    function showErrorState(message) {
        temperature.textContent = '--°C';
        weatherCondition.textContent = 'Error';
        locationElement.textContent = message || 'City not found. Please try again.';
        forecastContainer.innerHTML = '';
        uvIndex.textContent = '--';
        windSpeed.textContent = '--';
        windDirection.textContent = '--';
        humidity.textContent = '--%';
        humidityStatus.textContent = '--';
    }

    // Update UI with weather data
    function updateWeatherUI(data) {
        try {
            // Update temperature with one decimal place
            temperature.textContent = `${data.main.temp.toFixed(1)}°C`;
            
            // Update weather icon
            const isNight = data.dt > data.sys.sunset || data.dt < data.sys.sunrise;
            const weatherIcon = document.querySelector('.weather-icon i');
            const iconClass = getWeatherIcon(data.weather[0].id, isNight);
            weatherIcon.className = `wi ${iconClass}`;
            
            // Update date and time
            const currentDate = new Date();
            const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
            date.textContent = currentDate.toLocaleDateString('en-US', options);
            
            // Update weather condition with description
            weatherCondition.textContent = data.weather[0].description.charAt(0).toUpperCase() + 
                                         data.weather[0].description.slice(1);
            
            // Update location
            locationElement.textContent = `${data.name}, ${data.sys.country}`;
            
            // Update wind information
            windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)}`; // Convert m/s to km/h
            windDirection.textContent = getWindDirection(data.wind.deg);
            
            // Update humidity
            humidity.textContent = `${data.main.humidity}%`;
            humidityStatus.textContent = getHumidityStatus(data.main.humidity);
            
            // Update UV index (simulated)
            uvIndex.textContent = Math.floor(Math.random() * 12);
        } catch (error) {
            console.error('Error updating weather UI:', error);
            showErrorState('Error displaying weather data');
        }
    }

    // Update forecast UI
    function updateForecastUI(data) {
        try {
            forecastContainer.innerHTML = '';
            
            const dailyForecasts = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt * 1000);
                const today = new Date();
                return forecastDate.getDate() !== today.getDate();
            }).reduce((unique, forecast) => {
                const forecastDate = new Date(forecast.dt * 1000);
                const existingDate = unique.find(f => 
                    new Date(f.dt * 1000).getDate() === forecastDate.getDate()
                );
                if (!existingDate) {
                    unique.push(forecast);
                }
                return unique;
            }, []).slice(0, 6);

            dailyForecasts.forEach(forecast => {
                const date = new Date(forecast.dt * 1000);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const iconClass = getWeatherIcon(forecast.weather[0].id);
                
                const forecastItem = document.createElement('div');
                forecastItem.className = 'forecast-item';
                forecastItem.innerHTML = `
                    <div class="day">${dayName}</div>
                    <div class="forecast-icon">
                        <i class="wi ${iconClass}"></i>
                    </div>
                    <div class="temp">${Math.round(forecast.main.temp)}°C</div>
                `;
                forecastContainer.appendChild(forecastItem);
            });
        } catch (error) {
            console.error('Error updating forecast UI:', error);
        }
    }

    // Helper functions
    function getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                           'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    function getHumidityStatus(humidity) {
        if (humidity <= 30) return 'Low';
        if (humidity <= 60) return 'Normal';
        return 'High';
    }

    function getWeatherIcon(weatherCode, isNight = false) {
        // Weather condition codes: https://openweathermap.org/weather-conditions
        const icons = {
            // Thunderstorm
            '2': 'wi-thunderstorm',
            // Drizzle
            '3': 'wi-sprinkle',
            // Rain
            '5': 'wi-rain',
            // Snow
            '6': 'wi-snow',
            // Atmosphere (mist, smoke, haze, etc.)
            '7': 'wi-fog',
            // Clear
            '800': 'wi-day-sunny',
            // Clouds
            '801': 'wi-day-cloudy',
            '802': 'wi-cloud',
            '803': 'wi-cloudy',
            '804': 'wi-cloudy'
        };

        const code = weatherCode.toString();
        let icon;

        if (code === '800') {
            icon = isNight ? 'wi-night-clear' : 'wi-day-sunny';
        } else if (code.startsWith('8')) {
            icon = icons[code] || 'wi-cloudy';
        } else {
            icon = icons[code[0]] || 'wi-day-sunny';
        }

        return icon;
    }

    // Initialize with default city
    getWeatherData('Greater Noida');
});
