let lastWeatherData = null;

let currentUnits = {
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm'
};

async function getdata(city = 'Makhachkala') {
    const mainContent = document.querySelector('.main-content');
    const errorState = document.getElementById('errorState');
    const searchSection = document.querySelector('.header-content');
    const cityNameLabel = document.querySelector('.city-name');

    try {
        if (errorState) errorState.style.display = 'none';
        if (searchSection) searchSection.style.display = 'block';

        if (mainContent) mainContent.style.display = 'grid'; 
        showLoaders(); 

        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.results) throw new Error('City not found');

        const { latitude, longitude, name, country } = geoData.results[0];
        if (cityNameLabel) cityNameLabel.textContent = `${name}, ${country}`;

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=${currentUnits.temperature_unit}&wind_speed_unit=${currentUnits.wind_speed_unit}&precipitation_unit=${currentUnits.precipitation_unit}`);

        if (!response.ok) throw new Error('API down');

        const data = await response.json();
        lastWeatherData = data;

        renderHourly(data.hourly, 0);
        renderDaily(data.daily);
        renderCurrentWeather(data);

    } catch (error) {
        console.error('Ошибка:', error.message);
        if (mainContent) mainContent.style.display = 'none';
        if (searchSection) searchSection.style.display = 'none';
        if (errorState) errorState.style.display = 'flex';
    }
}
getdata();

const unitsBtn = document.querySelector('.units-button');
const dropdown = document.getElementById('unitsDropdown');
const options = document.querySelectorAll('.option');
const systemToggle = document.getElementById('systemToggle');

unitsBtn.addEventListener('click', () => dropdown.classList.toggle('show'));

options.forEach(function (item) {
    item.addEventListener('click', function () {
        const parent = item.parentElement;
        const currentActive = parent.querySelector('.option.active');
        if (currentActive) currentActive.classList.remove('active');
        item.classList.add('active');

        const sectionTitle = item.closest('.dropdown-section').querySelector('.section-title').textContent.toLowerCase();
        const selectedUnit = item.dataset.unit;

        if (sectionTitle.includes('temperature')) currentUnits.temperature_unit = selectedUnit;
        if (sectionTitle.includes('wind')) currentUnits.wind_speed_unit = selectedUnit;
        if (sectionTitle.includes('precipitation')) currentUnits.precipitation_unit = selectedUnit;

        const currentCity = document.querySelector('.city-name').textContent.split(',')[0];
        getdata(currentCity);
    });
});

systemToggle.addEventListener('change', function () {
    if (this.checked) {
        document.querySelector('[data-unit="fahrenheit"]').click();
        document.querySelector('[data-unit="mph"]').click();
        document.querySelector('[data-unit="inch"]').click();
    } else {
        document.querySelector('[data-unit="celsius"]').click();
        document.querySelector('[data-unit="kmh"]').click();
        document.querySelector('[data-unit="mm"]').click();
    }
});

function getWeatherIcon(code) {
    if (code === 0) return 'icon-sunny.webp';
    if (code >= 1 && code <= 3) return 'icon-partly-cloudy.webp';
    if (code === 45 || code === 48) return 'icon-fog.webp';
    if (code >= 51 && code <= 57) return 'icon-drizzle.webp';
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'icon-rain.webp';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'icon-snow.webp';
    if (code >= 95) return 'icon-storm.webp';
    return 'icon-sunny.webp';
}

function renderHourly(hourlyData, dayIndex = 0) {
    const container = document.getElementById('hourlyContainer');
    container.innerHTML = '';
    const currentHour = new Date().getHours();
    const startIndex = (dayIndex * 24) + (dayIndex === 0 ? currentHour : 0);

    for (let i = 0; i < 8; i++) {
        const idx = startIndex + i;
        if (!hourlyData.time[idx]) break;

        const timeValue = hourlyData.time[idx];
        const tempValue = Math.round(hourlyData.temperature_2m[idx]);
        const code = hourlyData.weather_code[idx];
        const hourLabel = new Date(timeValue).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

        const html = `
            <div class="hourly-row">
                <div class="hourly-time-info">
                    <img src="./assets/images/${getWeatherIcon(code)}" class="hourly-icon">
                    <span class="hour">${hourLabel}</span>
                </div>
                <span class="hour-temp">${tempValue}°</span>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
    }
}

function renderDaily(dailyData) {
    const forecastContainer = document.querySelector('.weather-forecast');
    if (!forecastContainer) return;
    forecastContainer.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(dailyData.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const maxTemp = Math.round(dailyData.temperature_2m_max[i]);
        const minTemp = Math.round(dailyData.temperature_2m_min[i]);
        const code = dailyData.weather_code[i];

        const html = `
            <div class="forecast-card">
                <span class="forecast-day">${dayName}</span>
                <img src="./assets/images/${getWeatherIcon(code)}" class="forecast-weather-icon">
                <div class="forecast-temps">
                    <span class="temp-max">${maxTemp}°</span>
                    <span class="temp-min">${minTemp}°</span>
                </div>
            </div>`;
        forecastContainer.insertAdjacentHTML('beforeend', html);
    }
}

function renderCurrentWeather(data) {
    const mainTemp = document.querySelector('.main-temp');
    const mainIcon = document.querySelector('.weather-icon-main');
    const currentDateLabel = document.querySelector('.current-date');
    const descValues = document.querySelectorAll('.desc-value');

    const tempUnit = data.current_units.temperature_2m;
    const windUnit = data.current_units.wind_speed_10m;

    if (mainTemp) mainTemp.textContent = `${Math.round(data.current.temperature_2m)}${tempUnit}`;
    if (mainIcon) mainIcon.src = `./assets/images/${getWeatherIcon(data.current.weather_code)}`;

    if (currentDateLabel) {
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
        currentDateLabel.textContent = new Date().toLocaleDateString('en-US', dateOptions);
    }

    if (descValues.length >= 3) {
        descValues[0].textContent = `${Math.round(data.current.apparent_temperature || data.current.temperature_2m)}${tempUnit}`;
        descValues[1].textContent = `${data.current.relative_humidity_2m}%`;
        descValues[2].textContent = `${Math.round(data.current.wind_speed_10m)} ${windUnit}`;
        
        const precipUnit = currentUnits.precipitation_unit;
        if (descValues[3]) descValues[3].textContent = `0 ${precipUnit}`;
    }
}

const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-button');
const autocompleteList = document.getElementById('autocomplete-list');
let debounceTimer;

function handleSearch() {
    const city = searchInput.value.trim();
    if (city) getdata(city);
    autocompleteList.style.display = 'none';
}

if (searchBtn) searchBtn.addEventListener('click', handleSearch);
if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (query.length < 2) {
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
        return;
    }
    debounceTimer = setTimeout(async () => {
        try {
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`);
            const data = await response.json();
            if (data.results) renderSuggestions(data.results);
            else autocompleteList.style.display = 'none';
        } catch (error) { console.error('Autocomplete error:', error); }
    }, 300);
});

function renderSuggestions(cities) {
    autocompleteList.innerHTML = '';
    autocompleteList.style.display = 'block';
    cities.forEach(city => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = `${city.name}, ${city.country} ${city.admin1 ? `(${city.admin1})` : ''}`;
        div.addEventListener('click', () => {
            searchInput.value = city.name;
            autocompleteList.style.display = 'none';
            getdata(city.name);
        });
        autocompleteList.appendChild(div);
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) autocompleteList.style.display = 'none';
    if (!e.target.closest('.units-container')) dropdown.classList.remove('show');
});

function initDaySelection() {
    const dayMenu = document.getElementById('dayMenu');
    const currentDayLabel = document.getElementById('currentDayLabel');
    const dayDropdownBtn = document.querySelector('.dropdown-btn');

    if (!dayMenu || !dayDropdownBtn) return;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayNum = new Date().getDay();
    const todayName = days[todayNum];

    if (currentDayLabel) currentDayLabel.textContent = todayName;

    dayMenu.addEventListener('click', function (e) {
        const target = e.target.closest('li');
        if (target && lastWeatherData) {
            const dayIndex = parseInt(target.dataset.index);
            if (currentDayLabel) currentDayLabel.textContent = target.textContent;
            dayMenu.querySelector('.active')?.classList.remove('active');
            target.classList.add('active');
            dayMenu.classList.remove('show');
            renderHourly(lastWeatherData.hourly, dayIndex);
        }
    });

    dayDropdownBtn.addEventListener('click', () => dayMenu.classList.toggle('show'));
}

function showLoaders() {
    const dailyContainer = document.querySelector('.weather-forecast');
    if (dailyContainer) {
        dailyContainer.innerHTML = ''; 
        for (let i = 0; i < 7; i++) {
            const loaderHtml = `<div class="forecast-card loader-card"></div>`;
            dailyContainer.insertAdjacentHTML('beforeend', loaderHtml);
        }
    }

    const hourlyContainer = document.getElementById('hourlyContainer');
    if (hourlyContainer) {
        hourlyContainer.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const loaderHtml = `<div class="hourly-row loader-row"></div>`;
            hourlyContainer.insertAdjacentHTML('beforeend', loaderHtml);
        }
    }

    const mainTemp = document.querySelector('.main-temp');
    const descValues = document.querySelectorAll('.desc-value');
    const mainIcon = document.querySelector('.weather-icon-main');

    if (mainTemp) mainTemp.textContent = '—';
    if (mainIcon) mainIcon.src = ''; 
    if (mainIcon) mainIcon.alt = 'Loading...'; 

    descValues.forEach(value => value.textContent = '—');
}

initDaySelection();