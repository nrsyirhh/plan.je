// ==========================================
// JSON DATABASE STORAGE & LOADER
// ==========================================
let dbData = {
    ktmFares: null,
    ktmSchedules: null,
    places: null
};

async function loadExternalData() {
    try {
        const [faresRes, schedRes, placesRes] = await Promise.allSettled([
            fetch('ktm-fare-matrix.json'),
            fetch('ktm-schedule.json'),
            fetch('malaysia_food_hotels_data (1).json')
        ]);

        if (faresRes.status === 'fulfilled' && faresRes.value.ok) {
            dbData.ktmFares = await faresRes.value.json();
        }
        if (schedRes.status === 'fulfilled' && schedRes.value.ok) {
            dbData.ktmSchedules = await schedRes.value.json();
        }
        if (placesRes.status === 'fulfilled' && placesRes.value.ok) {
            dbData.places = await placesRes.value.json();
        }
        console.log("Database files loaded successfully:", dbData);
    } catch (err) {
        console.warn("Using fallback/mock algorithmic data:", err);
    }
}

loadExternalData();

// ==========================================
// 1. DATA CONFIGURATION & HELPERS
// ==========================================
const locations = {
    'KUL': { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869 },
    'SHA': { name: 'Shah Alam', lat: 3.0738, lng: 101.5183 },
    'PEN': { name: 'Penang', lat: 5.4141, lng: 100.3288 },
    'JHB': { name: 'Johor Bahru', lat: 1.4927, lng: 103.7414 },
    'MKZ': { name: 'Melaka City', lat: 2.1960, lng: 102.2405 },
    'SBN': { name: 'Seremban', lat: 2.7258, lng: 101.9424 },
    'IPH': { name: 'Ipoh', lat: 4.5975, lng: 101.0901 },
    'KUA': { name: 'Kuantan', lat: 3.8126, lng: 103.3256 },
    'TGG': { name: 'Kuala Terengganu', lat: 5.3117, lng: 103.1324 },
    'KBR': { name: 'Kota Bharu', lat: 6.1254, lng: 102.2381 },
    'KAN': { name: 'Kangar', lat: 6.4436, lng: 100.1986 },
    'LGK': { name: 'Langkawi', lat: 6.3500, lng: 99.8000 },
    'KCH': { name: 'Kuching', lat: 1.5533, lng: 110.3592 },
    'BKI': { name: 'Kota Kinabalu', lat: 5.9804, lng: 116.0735 }
};

const itineraryTemplates = {
    'KUL': [
        { morning: { title: 'Batu Caves & Temples', desc: 'Climb the 272 steps into the limestone caves.', cost: 0, transport: 'KTM Komuter (~RM 3)' }, afternoon: { title: 'KLCC & Aquaria', desc: 'Visit the Twin Towers and the indoor aquarium.', cost: 75, transport: 'LRT to KLCC (~RM 2)' }, evening: { title: 'Jalan Alor Food Street', desc: 'Feast on authentic Malaysian street food.', cost: 35, transport: 'Monorail to Bukit Bintang' } },
        { morning: { title: 'Merdeka Square & Heritage', desc: 'Admire historic architecture and museums.', cost: 5, transport: 'LRT to Masjid Jamek' }, afternoon: { title: 'Central Market & Chinatown', desc: 'Explore handicrafts and Petaling Street.', cost: 20, transport: 'Walk (5 mins)' }, evening: { title: 'KL Tower Observation', desc: 'Watch sunset over the skyline.', cost: 60, transport: 'Grab (~RM 10)' } }
    ],
    'PEN': [
        { morning: { title: 'Georgetown Street Art', desc: 'Explore famous murals and Clan Jetties.', cost: 10, transport: 'Walk / Free CAT Bus' }, afternoon: { title: 'Penang Hill & Kek Lok Si', desc: 'Funicular train ride and temple visit.', cost: 30, transport: 'Grab / Bus 204' }, evening: { title: 'Gurney Drive Hawker Centre', desc: 'Try famous Penang Char Kuey Teow and Laksa.', cost: 25, transport: 'Bus 101' } },
        { morning: { title: 'Pinang Peranakan Mansion', desc: 'Heritage museum of Baba Nyonya culture.', cost: 25, transport: 'Walk' }, afternoon: { title: 'Batu Ferringhi Beach', desc: 'Relax by the sea or try water sports.', cost: 20, transport: 'Bus 101 (~RM 2)' }, evening: { title: 'Beach Night Market', desc: 'Seafood dinner by the sea.', cost: 40, transport: 'Walk' } }
    ],
    'MKZ': [
        { morning: { title: 'Historical Red Square', desc: 'Explore Stadthuys, St. Paul Hill & A Famosa.', cost: 0, transport: 'Walk' }, afternoon: { title: 'Melaka River Cruise', desc: 'Scenic river boat tour with mural sights.', cost: 30, transport: 'Walk' }, evening: { title: 'Jonker Street Night Market', desc: 'Chicken rice balls and Nyonya Cendol.', cost: 35, transport: 'Walk' } }
    ],
    'DEFAULT': [
        { morning: { title: 'City Highlights & Landmarks', desc: 'Explore historical sites and architecture.', cost: 15, transport: 'Walk / Local Bus' }, afternoon: { title: 'Local Culture & Attractions', desc: 'Visit popular museums or iconic parks.', cost: 25, transport: 'Grab / Taxi' }, evening: { title: 'Local Night Market Food Trail', desc: 'Taste iconic local cuisine and specialties.', cost: 30, transport: 'Walk' } }
    ]
};

// KTM Mapping
const ktmStationMap = {
    'KUL': 'KL SENTRAL', 'SHA': 'SHAH ALAM', 'PEN': 'BUTTERWORTH',
    'IPH': 'IPOH', 'SBN': 'SEREMBAN', 'MKZ': 'BATANG MELAKA',
    'KAN': 'ARAU', 'KBR': 'WAKAF BHARU'
};

function lookupKTMFare(originCode, destCode) {
    if (!dbData.ktmFares) return null;
    const originStation = ktmStationMap[originCode] || originCode;
    const destStation = ktmStationMap[destCode] || destCode;

    if (dbData.ktmFares[originStation] && dbData.ktmFares[originStation][destStation]) {
        return dbData.ktmFares[originStation][destStation];
    }
    const combinedKey = `${originStation}_${destStation}`;
    if (dbData.ktmFares[combinedKey]) return dbData.ktmFares[combinedKey];
    return null;
}

// Booking URL Helpers
function getTransportBookingUrl(type, originCode, destCode) {
    const originName = locations[originCode]?.name || originCode;
    const destName = locations[destCode]?.name || destCode;

    if (type.includes('Flight')) {
        return `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(originName)}+to+${encodeURIComponent(destName)}`;
    }
    if (type.includes('Bus')) {
        return `https://www.redbus.my/`;
    }
    return `https://online.ktmb.com.my/`;
}

function getHotelBookingUrl(hotelName, destName) {
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotelName + ' ' + destName)}`;
}

// Fallback Food Guide
const localFoodGuides = {
    'DEFAULT': [
        { icon: '🍛', name: 'Nasi Campur', price: 'RM 8 - 15', places: 'Popular local food courts' },
        { icon: '🍜', name: 'Local Noodles', price: 'RM 6 - 10', places: 'Night markets & hawker stalls' },
        { icon: '☕', name: 'Teh Tarik', price: 'RM 2 - 4', places: 'Any local mamak' }
    ]
};

// ==========================================
// 2. GLOBALS & GENERATORS
// ==========================================
let mapInstance = null;
let budgetChartInstance = null;

let currentBudgetLimit = 0;
let currentTransportCost = 0;
let currentFoodCost = 0;
let currentActivitiesCost = 0;
let selectedHotelTotal = 0; 

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    return Math.max(30, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

function generateDynamicRoute(originCode, destCode) {
    const origin = locations[originCode];
    const dest = locations[destCode];
    const distanceKm = calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    const isCrossingSea = (origin.lng > 108 && dest.lng < 105) || (origin.lng < 105 && dest.lng > 108);

    let options = [{ type: "Flight", cost_per_pax: Math.round(distanceKm * 0.18 + 70), duration_hours: +(distanceKm / 550 + 0.8).toFixed(1) }];

    if (!isCrossingSea) {
        options.push({ type: "Express Bus", cost_per_pax: Math.max(15, Math.round(distanceKm * 0.11)), duration_hours: +(distanceKm / 70 + 0.5).toFixed(1) });
        if (distanceKm <= 400) options.push({ type: "Train / Carpool", cost_per_pax: Math.max(20, Math.round(distanceKm * 0.16)), duration_hours: +(distanceKm / 80).toFixed(1) });
    }
    return { distance_km: distanceKm, options: options, daily_living_cost: 130 };
}

function getMockHotels(baseLat, baseLng) {
    return [
        { id: 1, name: "Premium Boutique Stay", rating: "4.5", reviews: 378, price: 150, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop", lat: baseLat + 0.005, lng: baseLng - 0.01 },
        { id: 2, name: "City Center Resort", rating: "4.0", reviews: 4200, price: 110, img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200&h=150&fit=crop", lat: baseLat - 0.01, lng: baseLng + 0.015 },
        { id: 3, name: "Budget Inn Suites", rating: "3.5", reviews: 250, price: 65, img: "https://images.unsplash.com/photo-1551882547-ff40c0d1398c?w=200&h=150&fit=crop", lat: baseLat + 0.015, lng: baseLng + 0.02 },
        { id: 4, name: "Backpacker Hostel", rating: "4.2", reviews: 120, price: 35, img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=200&h=150&fit=crop", lat: baseLat - 0.015, lng: baseLng - 0.005 }
    ];
}

// ==========================================
// 3. MAIN APPLICATION LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
   // HERO GET STARTED AUTOMATION
    const btnGetStarted = document.getElementById('btn-get-started');
    const plannerContainer = document.getElementById('planner-container');

    if (btnGetStarted && plannerContainer) {
        btnGetStarted.addEventListener('click', () => {
            // Unhide and animate the container
            plannerContainer.classList.add('slide-top');
            
            // Scroll down smoothly, offsetting for the fixed navbar
            const yOffset = -80; 
            const y = plannerContainer.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    }
    const originSelect = document.getElementById('origin');
    const destinationSelect = document.getElementById('destination');
    const tripForm = document.getElementById('trip-form');

    function recalculateBudgetUI() {
        const finalEstimatedCost = currentTransportCost + currentFoodCost + currentActivitiesCost + selectedHotelTotal;
        const balance = currentBudgetLimit - finalEstimatedCost;

        document.getElementById('res-est-cost').textContent = `RM ${finalEstimatedCost.toFixed(2)}`;
        
        const statusBanner = document.getElementById('affordability-status');
        const balanceEl = document.getElementById('res-balance');

        if (balance >= 0) {
            statusBanner.className = 'status-banner status-success';
            statusBanner.innerHTML = 'YES! You can afford this trip! 🎉';
            balanceEl.textContent = `+ RM ${balance.toFixed(2)}`;
            balanceEl.style.color = '#166534';
        } else {
            statusBanner.className = 'status-banner status-danger';
            statusBanner.innerHTML = ` OVER BUDGET BY RM ${Math.abs(balance).toFixed(2)}`;
            balanceEl.textContent = `- RM ${Math.abs(balance).toFixed(2)}`;
            balanceEl.style.color = '#991b1b';
        }

        let chartLabels = ['Transport', 'Accommodation', 'Food', 'Activities'];
        let chartData = [currentTransportCost, selectedHotelTotal, currentFoodCost, currentActivitiesCost];
        // Signature Red, Deep Navy, Slate Gray, Soft Silver
let chartColors = ['#E9B86C', '#C41721', '#6C070F', '#F6D89A'];

        if (balance > 0) {
            chartLabels.push('Remaining Balance');
            chartData.push(balance);
            chartColors.push('#e2e8f0');
        }

        const ctx = document.getElementById('budgetChart').getContext('2d');
        if (budgetChartInstance) budgetChartInstance.destroy(); 
        
        budgetChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: chartLabels, datasets: [{ data: chartData, backgroundColor: chartColors, borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, animation: { duration: 400 } }
        });
    }

    // FORM SUBMISSION ENGINE
    tripForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const origin = originSelect.value;
        const destination = destinationSelect.value;
        const budget = parseFloat(document.getElementById('budget').value);
        const days = parseInt(document.getElementById('days').value, 10);
        const travellers = parseInt(document.getElementById('travellers').value, 10);
        const priority = document.getElementById('priority').value;

        if (origin === destination) {
            alert("Please select a destination that is different from your origin.");
            return;
        }

        try {
            // Setup Base Costs
            currentBudgetLimit = budget;
            currentActivitiesCost = 30 * days * travellers;
            currentFoodCost = 45 * days * travellers;
            
            // Sync Slider
            const budgetSlider = document.getElementById('interactive-budget');
            if(budgetSlider) {
                budgetSlider.min = budget * 0.5;
                budgetSlider.max = budget * 2.0;
                budgetSlider.value = budget;
            }
            const sliderVal = document.getElementById('slider-val');
            if(sliderVal) sliderVal.textContent = budget.toFixed(2);

            let routeInfo = generateDynamicRoute(origin, destination);

            // KTM Fare Logic
            const realKtmFare = lookupKTMFare(origin, destination);
            if (realKtmFare) {
                const trainIndex = routeInfo.options.findIndex(opt => opt.type.includes('Train'));
                const farePrice = typeof realKtmFare === 'number' ? realKtmFare : (realKtmFare.fare || realKtmFare.price || 45);
                const travelDuration = realKtmFare.duration || +(routeInfo.distance_km / 85).toFixed(1);

                if (trainIndex !== -1) {
                    routeInfo.options[trainIndex].cost_per_pax = farePrice;
                    routeInfo.options[trainIndex].duration_hours = travelDuration;
                    routeInfo.options[trainIndex].type = "KTM ETS / Komuter (Live Price)";
                } else {
                    routeInfo.options.push({ type: "KTM ETS / Komuter (Live Price)", cost_per_pax: farePrice, duration_hours: travelDuration });
                }
            }

            // Transport Cards
            let transportOptions = [...routeInfo.options];
            let recommendedTransport;

            if (priority === 'cheapest') {
                recommendedTransport = [...transportOptions].sort((a, b) => a.cost_per_pax - b.cost_per_pax)[0];
            } else if (priority === 'fastest') {
                recommendedTransport = [...transportOptions].sort((a, b) => a.duration_hours - b.duration_hours)[0];
            } else { 
                recommendedTransport = [...transportOptions].sort((a, b) => (a.cost_per_pax * a.duration_hours) - (b.cost_per_pax * b.duration_hours))[0];
            }

            const transportContainer = document.getElementById('transport-options-list');
            if (transportContainer) {
                transportContainer.innerHTML = '';
                transportOptions.forEach((option) => {
                    const isRecommended = option.type === recommendedTransport.type;
                    const totalRoundTripCost = option.cost_per_pax * travellers * 2;
                    const bookingUrl = getTransportBookingUrl(option.type, origin, destination);
                    
                    let icon = '🚆';
                    if (option.type.includes('Flight')) icon = '✈️';
                    if (option.type.includes('Bus')) icon = '🚌';

                    const card = document.createElement('div');
                    card.className = 'transport-card';
                    if (isRecommended) card.classList.add('selected');

                    card.innerHTML = `
                        ${isRecommended ? '<div class="transport-badge">⭐ Recommended</div>' : ''}
                        <div class="transport-title">${icon} ${option.type}</div>
                        <div class="transport-meta">⏱️ ~${option.duration_hours} hrs (one-way)</div>
                        <div class="transport-price">RM ${totalRoundTripCost} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">/ round-trip</span></div>
                        <a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" class="btn-book-link" onclick="event.stopPropagation()">Book Ticket ↗</a>
                    `;

                    card.addEventListener('click', () => {
                        document.querySelectorAll('.transport-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        currentTransportCost = totalRoundTripCost;
                        recalculateBudgetUI();
                    });
                    transportContainer.appendChild(card);
                });
            }
            currentTransportCost = recommendedTransport.cost_per_pax * travellers * 2;


            // State Mapping for JSON
            const destCoords = locations[destination];
            let hotels = [];
            const stateNameMap = {
                'KUL': 'Kuala Lumpur', 'SHA': 'Selangor', 'PEN': 'Penang', 
                'JHB': 'Johor', 'MKZ': 'Malacca', 'SBN': 'Negeri Sembilan', 
                'IPH': 'Perak', 'KUA': 'Pahang', 'TGG': 'Terengganu', 
                'KBR': 'Kelantan', 'KAN': 'Perlis', 'LGK': 'Kedah',
                'KCH': 'Sarawak', 'BKI': 'Sabah'
            };
            const fullStateName = stateNameMap[destination] || destination;

            // Hotels Logic
            if (dbData.places && dbData.places.hotels && dbData.places.hotels[fullStateName]) {
                const stateHotels = dbData.places.hotels[fullStateName];
                hotels = stateHotels.sort((a, b) => b.rating - a.rating).slice(0, 4).map((h, i) => {
                    return {
                        id: h.id || i, name: h.name,
                        rating: h.rating || 4.0, reviews: h.reviews || Math.floor(Math.random() * 500) + 50,
                        price: h.priceRange ? h.priceRange.min : (h.price || 150),
                        img: h.image || h.img || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop",
                        lat: h.lat || (destCoords.lat + (Math.random() - 0.5) * 0.05),
                        lng: h.lng || (destCoords.lng + (Math.random() - 0.5) * 0.05)
                    };
                });
            }
            if (hotels.length === 0) hotels = getMockHotels(destCoords.lat, destCoords.lng);
            
            if (!mapInstance) {
                mapInstance = L.map('map').setView([destCoords.lat, destCoords.lng], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapInstance);
            } else {
                mapInstance.setView([destCoords.lat, destCoords.lng], 13);
                mapInstance.eachLayer(layer => { if (layer instanceof L.Marker) mapInstance.removeLayer(layer); });
            }

            const hotelContainer = document.getElementById('hotel-list') || document.getElementById('hotel-cards');
            if (hotelContainer) {
                hotelContainer.innerHTML = ''; 
                hotels.forEach((hotel, index) => {
                    const marker = L.marker([hotel.lat, hotel.lng]).addTo(mapInstance)
                        .bindPopup(`<b>${hotel.name}</b><br>RM ${hotel.price}/night`);
                    
                    const isSelected = index === 0;
                    const thisHotelTotal = hotel.price * days;
                    const hotelBookUrl = getHotelBookingUrl(hotel.name, locations[destination].name);

                    const card = document.createElement('div');
                    card.className = `hotel-card ${isSelected ? 'selected' : ''}`;
                    card.innerHTML = `
                        <img src="${hotel.img}" alt="${hotel.name}" class="hotel-img">
                        <div class="hotel-info">
                            <h4 style="margin: 0; font-size: 1rem;">${hotel.name}</h4>
                            <div style="font-size: 0.85rem; color: #f59e0b;">⭐ ${hotel.rating} (${hotel.reviews})</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">RM ${hotel.price} / night</div>
                            <div style="font-weight: bold; color: var(--primary-color); margin-top: 0.25rem;">Total: RM ${thisHotelTotal}</div>
                            <a href="${hotelBookUrl}" target="_blank" rel="noopener noreferrer" class="btn-book-link" onclick="event.stopPropagation()">Book Stay ↗</a>
                        </div>
                    `;

                    card.addEventListener('click', () => {
                        document.querySelectorAll('.hotel-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        selectedHotelTotal = thisHotelTotal;
                        marker.openPopup();
                        mapInstance.setView([hotel.lat, hotel.lng], 15);
                        recalculateBudgetUI();
                    });
                    hotelContainer.appendChild(card);
                });
                selectedHotelTotal = hotels[0].price * days;
            }

            // Food Logic
            const foodListContainer = document.getElementById('food-guide-list');
            if (foodListContainer) {
                let localFoods = [];
                if (dbData.places && dbData.places.food && dbData.places.food[fullStateName]) {
                    const stateFoods = dbData.places.food[fullStateName];
                    const topFoods = stateFoods.sort((a, b) => b.rating - a.rating).slice(0, 3);
                    
                    localFoods = topFoods.map(item => {
                        let icon = '🍽️';
                        let type = item.type ? item.type.toLowerCase() : '';
                        let imgUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop';
                        
                        if (type.includes('seafood')) { icon = '🦀'; imgUrl = 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=150&h=150&fit=crop'; } 
                        else if (type.includes('cafe') || type.includes('western')) { icon = '☕'; imgUrl = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=150&h=150&fit=crop'; } 
                        else if (type.includes('chinese') || type.includes('noodle')) { icon = '🍜'; imgUrl = 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=150&h=150&fit=crop'; } 
                        else if (type.includes('indian') || type.includes('mamak') || type.includes('malay')) { icon = '🍛'; imgUrl = 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=150&h=150&fit=crop'; }
                        
                        const finalImage = item.image || item.img || imgUrl;
                        return {
                            icon: icon, name: item.name, image: finalImage,
                            price: `RM ${item.priceRange.min} - ${item.priceRange.max}`,
                            places: `${item.location} (⭐ ${item.rating})`
                        };
                    });
                } else {
                    localFoods = localFoodGuides[destination] || localFoodGuides['DEFAULT'];
                }
                
                foodListContainer.innerHTML = localFoods.map(food => `
                    <div class="food-card">
                        <span class="food-icon-badge">${food.icon || '🍽️'}</span>
                        <img src="${food.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop'}" alt="${food.name}" class="food-img">
                        <div class="food-details">
                            <span class="food-name" style="line-height: 1.2;">${food.name}</span>
                            <span class="food-price">${food.price || ''}</span>
                            <span class="food-places" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; display: block;">
                                📍 ${food.places || 'Local Eats'}
                            </span>
                        </div>
                    </div>
                `).join('');
            }

            document.getElementById('results-section').style.display = 'block';
            document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
            if (mapInstance) setTimeout(() => mapInstance.invalidateSize(), 300);
            
            recalculateBudgetUI();

        } catch (error) {
            console.error("Error generating trip data:", error);
            alert("Something went wrong while generating the route. Please try again.");
        }
    });

    // ==========================================
    // UTILITY: PACKING LIST GENERATOR & MOVER
    // ==========================================
    const renderCategory = (title, items, categoryId) => `
        <div class="packing-category" id="${categoryId}">
            <div class="category-header">
                <h4 contenteditable="true" class="editable-category-title" title="Click to rename">${title}</h4>
                <div class="category-controls">
                    <button type="button" class="btn-move" onclick="moveCategory(this, -1)" title="Move Up">⬆️</button>
                    <button type="button" class="btn-move" onclick="moveCategory(this, 1)" title="Move Down">⬇️</button>
                </div>
            </div>
            <div class="category-list">
                ${items.map(item => `
                    <div class="packing-item">
                        <label class="packing-item-left">
                            <input type="checkbox"> <span>${item}</span>
                        </label>
                        <button type="button" class="btn-delete-item" onclick="this.parentElement.remove()" title="Remove item">×</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    window.moveCategory = function(btn, direction) {
        const categoryDiv = btn.closest('.packing-category');
        const parent = categoryDiv.parentElement;
        if (direction === -1 && categoryDiv.previousElementSibling) parent.insertBefore(categoryDiv, categoryDiv.previousElementSibling);
        else if (direction === 1 && categoryDiv.nextElementSibling) parent.insertBefore(categoryDiv.nextElementSibling, categoryDiv);
    };

    // ==========================================
    // ITINERARY & WEATHER BUILDER
    // ==========================================
    const btnViewItinerary = document.getElementById('btn-view-itinerary');
    const itinerarySection = document.getElementById('itinerary-section');
    const itineraryContent = document.getElementById('itinerary-content');

    function getWeatherEmoji(code) {
        if (code <= 3) return '☀️ Sunny';
        if (code <= 48) return '🌫️ Cloudy';
        if (code <= 67) return '🌧️ Light Rain';
        if (code <= 77) return '❄️ Cold';
        if (code <= 82) return '⛈️ Heavy Rain';
        return '⛈️ Thunderstorm';
    }

    if (btnViewItinerary) {
        btnViewItinerary.addEventListener('click', async () => {
            const destVal = destinationSelect.value;
            const days = parseInt(document.getElementById('days').value, 10);
            const template = itineraryTemplates[destVal] || itineraryTemplates['DEFAULT'];

            const startDateValue = document.getElementById('start-date').value;
            const displayDate = startDateValue ? new Date(startDateValue).toLocaleDateString('en-GB') : '';
            document.getElementById('itinerary-subtitle').textContent = `${locations[destVal].name} • ${days} Day(s) Plan ${displayDate ? '(Starts ' + displayDate + ')' : ''}`;
            
            itineraryContent.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">⏳ Retrieving real-time weather data...</div>';
            itinerarySection.style.display = 'block';
            itinerarySection.scrollIntoView({ behavior: 'smooth' });

            const destCoords = locations[destVal];
            let weatherData = [];
            
            try {
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${destCoords.lat}&longitude=${destCoords.lng}&daily=weathercode,temperature_2m_max&timezone=Asia%2FSingapore`);
                const data = await response.json();
                
                for (let i = 0; i < days; i++) {
                    const index = i < data.daily.time.length ? i : data.daily.time.length - 1;
                    const temp = Math.round(data.daily.temperature_2m_max[index]);
                    const condition = getWeatherEmoji(data.daily.weathercode[index]);
                    weatherData.push(`${condition} ${temp}°C`);
                }
            } catch (error) {
                console.error("Error retrieving the weather data:", error);
                for (let i = 0; i < days; i++) weatherData.push('🌤️ 32°C');
            }

            itineraryContent.innerHTML = '';

            for (let i = 0; i < days; i++) {
                const dayPlan = template[i % template.length];
                const todayWeather = weatherData[i];

                const dayHTML = `
                    <div class="itinerary-day">
                        <h4>Day ${i + 1} <span class="weather-badge">${todayWeather}</span></h4>
                        <div class="activity">
                            <strong>🌅 Morning (8:00 AM - 12:00 PM)</strong>
                            <p class="act-title">${dayPlan.morning.title}</p>
                            <p class="act-desc">${dayPlan.morning.desc}</p>
                            <div class="act-meta">
                                <span class="badge badge-transport">🚌 ${dayPlan.morning.transport}</span>
                                <span class="badge badge-cost">💰 Est. RM ${dayPlan.morning.cost}</span>
                            </div>
                        </div>
                        <div class="activity">
                            <strong>☀️ Afternoon (1:00 PM - 5:00 PM)</strong>
                            <p class="act-title">${dayPlan.afternoon.title}</p>
                            <p class="act-desc">${dayPlan.afternoon.desc}</p>
                            <div class="act-meta">
                                <span class="badge badge-transport">🚌 ${dayPlan.afternoon.transport}</span>
                                <span class="badge badge-cost">💰 Est. RM ${dayPlan.afternoon.cost}</span>
                            </div>
                        </div>
                        <div class="activity">
                            <strong>🌙 Evening (6:00 PM - 9:00 PM)</strong>
                            <p class="act-title">${dayPlan.evening.title}</p>
                            <p class="act-desc">${dayPlan.evening.desc}</p>
                            <div class="act-meta">
                                <span class="badge badge-transport">🚌 ${dayPlan.evening.transport}</span>
                                <span class="badge badge-cost">💰 Est. RM ${dayPlan.evening.cost}</span>
                            </div>
                        </div>
                    </div>
                `;
                itineraryContent.innerHTML += dayHTML;
            }

            const packingContent = document.getElementById('packing-list-content');
            const shirts = days + 1;
            const undies = days + 1;
            const socks = days;

            const essentials = ['MyKad / Passport', 'Phone Charger', 'Powerbank', 'Toiletries', 'Personal Meds'];
            const clothing = [`${shirts}x T-Shirts / Tops`, `${undies}x Underwear`, `${socks}x Pairs of Socks`, `1x Sleepwear`, `1x Light Jacket`];
            let specific = [];

            if (['LGK', 'PEN', 'BKI', 'TGG'].includes(destVal)) specific.push('Swimwear & Beach Towel', 'Sunscreen (SPF 50+)', 'Sunglasses & Hat', 'Flip-flops');
            if (['KUL', 'PEN', 'MKZ', 'JHB', 'IPH'].includes(destVal)) specific.push('Comfortable Walking Shoes', 'Wet Wipes / Tissues', 'Small Umbrella', 'Digestive Meds / Gaviscon');
            if (['KCH', 'BKI', 'KUA'].includes(destVal)) specific.push('Insect Repellent', 'Hiking / Trail Shoes', 'Reusable Water Bottle');
            
            specific = [...new Set(specific)];
            if (specific.length === 0) specific.push('Camera / Smartphone', 'Reusable Shopping Bag');

            if (packingContent) {
                packingContent.innerHTML = 
                    renderCategory('🧳 Essentials', essentials, 'cat-essentials') +
                    renderCategory('👕 Clothing', clothing, 'cat-clothing') +
                    renderCategory('📍 Destination Prep', specific, 'cat-prep') +
                    renderCategory('✨ Extras', [], 'cat-extras');
            }
        });
    }

    // ==========================================
    // INTERACTIVE LIST BUTTONS
    // ==========================================
    const btnAddCustom = document.getElementById('btn-add-custom-item');
    const inputCustom = document.getElementById('custom-item-input');
    const btnAddCategory = document.getElementById('btn-add-category');

    if (btnAddCustom && inputCustom) {
        btnAddCustom.onclick = () => {
            const val = inputCustom.value.trim();
            if (!val) return;

            const allCategories = document.querySelectorAll('.category-list');
            if (allCategories.length > 0) {
                const targetList = allCategories[allCategories.length - 1]; 
                
                const newItem = document.createElement('div');
                newItem.className = 'packing-item';
                newItem.innerHTML = `
                    <label class="packing-item-left">
                        <input type="checkbox"> <span>${val}</span>
                    </label>
                    <button type="button" class="btn-delete-item" onclick="this.parentElement.remove()" title="Remove item">×</button>
                `;
                targetList.appendChild(newItem);
                inputCustom.value = ''; 
            }
        };

        inputCustom.onkeypress = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnAddCustom.click(); }
        };
    }

    if (btnAddCategory) {
        btnAddCategory.onclick = () => {
            const packingContent = document.getElementById('packing-list-content');
            const newId = 'cat-custom-' + Date.now();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = renderCategory('✏️ Click to Rename', [], newId);
            packingContent.appendChild(tempDiv.firstElementChild);
        };
    }

    // ==========================================
    // UTILITIES: SLIDER, CLOSE, PDF & iCAL
    // ==========================================
    document.getElementById('btn-close-itinerary').addEventListener('click', () => {
        if(itinerarySection) itinerarySection.style.display = 'none';
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    });

    const pdfBtn = document.getElementById('btn-download-pdf');
    if(pdfBtn) {
        pdfBtn.addEventListener('click', function() {
            const btn = this;
            const originalText = btn.innerHTML;
            btn.innerHTML = "⏳ Generating PDF...";
            
            const element = document.createElement('div');
            element.style.padding = '20px';
            element.style.backgroundColor = '#ffffff';
            element.innerHTML = `
                <h2 style="color: #2563eb; margin-bottom: 8px;">plan.je — Trip Itinerary</h2>
                <p style="color: #64748b; margin-bottom: 20px;">${document.getElementById('itinerary-subtitle').textContent}</p>
                ${document.getElementById('itinerary-content').innerHTML}
            `;
            
            html2pdf().set({
                margin: 0.5, filename: 'plan_je_Itinerary.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            }).from(element).save().then(() => btn.innerHTML = originalText);
        });
    }

    const budgetSlider = document.getElementById('interactive-budget');
    const sliderValDisplay = document.getElementById('slider-val');

    if (budgetSlider && sliderValDisplay) {
        budgetSlider.addEventListener('input', (e) => {
            const newBudget = parseFloat(e.target.value);
            sliderValDisplay.textContent = newBudget.toFixed(2);
            currentBudgetLimit = newBudget;
            recalculateBudgetUI(); 
        });
    }

    const btnExportCalendar = document.getElementById('btn-export-calendar');
    if (btnExportCalendar) {
        btnExportCalendar.addEventListener('click', () => {
            const destVal = destinationSelect.value;
            const destName = locations[destVal] ? locations[destVal].name : 'Trip';
            const days = parseInt(document.getElementById('days').value, 10);
            const template = itineraryTemplates[destVal] || itineraryTemplates['DEFAULT'];
            
            const startDateValue = document.getElementById('start-date').value;
            let tripStartDate = new Date();
            if (startDateValue) tripStartDate = new Date(startDateValue);
            else tripStartDate.setDate(tripStartDate.getDate() + 1);

            let icsData = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//plan.je//Itinerary Planner//EN\n";

            for (let i = 0; i < days; i++) {
                let currentDay = new Date(tripStartDate);
                currentDay.setDate(currentDay.getDate() + i);
                
                let dateStr = currentDay.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 8);
                const dayPlan = template[i % template.length];

                const createEvent = (timeStart, timeEnd, title, desc, cost, transport) => {
                    let event = "BEGIN:VEVENT\n";
                    event += `DTSTART:${dateStr}T${timeStart}00\n`;
                    event += `DTEND:${dateStr}T${timeEnd}00\n`;
                    event += `SUMMARY:${title} (${destName})\n`;
                    event += `DESCRIPTION:${desc} \\n\\nTransport: ${transport} \\nCost: RM ${cost}\n`;
                    event += "END:VEVENT\n";
                    return event;
                };

                icsData += createEvent('0800', '1200', dayPlan.morning.title, dayPlan.morning.desc, dayPlan.morning.cost, dayPlan.morning.transport);
                icsData += createEvent('1300', '1700', dayPlan.afternoon.title, dayPlan.afternoon.desc, dayPlan.afternoon.cost, dayPlan.afternoon.transport);
                icsData += createEvent('1800', '2100', dayPlan.evening.title, dayPlan.evening.desc, dayPlan.evening.cost, dayPlan.evening.transport);
            }

            icsData += "END:VCALENDAR";

            const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute('download', `plan_je_${destName.replace(/\s+/g, '_')}_Itinerary.ics`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});