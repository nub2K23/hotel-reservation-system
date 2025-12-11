// This file generates reports based on bookings and room availability, providing insights into the hotel's operations.

const bookings = []; // This will hold the booking data
const rooms = []; // This will hold the room data

// Function to load data from JSON files
async function loadData() {
    try {
        const bookingsResponse = await fetch('../data/bookings.json');
        const roomsResponse = await fetch('../data/rooms.json');
        bookings.push(...await bookingsResponse.json());
        rooms.push(...await roomsResponse.json());
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Function to generate a report of all bookings
function generateBookingReport() {
    const reportContainer = document.getElementById('report-container');
    reportContainer.innerHTML = ''; // Clear previous reports

    bookings.forEach(booking => {
        const bookingElement = document.createElement('div');
        bookingElement.innerHTML = `
            <p>Guest Name: ${booking.guestName}</p>
            <p>Room Number: ${booking.roomNumber}</p>
            <p>Check-in Date: ${booking.checkInDate}</p>
            <p>Check-out Date: ${booking.checkOutDate}</p>
            <p>Status: ${booking.status}</p>
            <hr>
        `;
        reportContainer.appendChild(bookingElement);
    });
}

// Function to generate a report of room availability
function generateRoomAvailabilityReport() {
    const reportContainer = document.getElementById('report-container');
    reportContainer.innerHTML = ''; // Clear previous reports

    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.innerHTML = `
            <p>Room Number: ${room.number}</p>
            <p>Type: ${room.type}</p>
            <p>Price: ${room.price}</p>
            <p>Status: ${room.isAvailable ? 'Available' : 'Occupied'}</p>
            <hr>
        `;
        reportContainer.appendChild(roomElement);
    });
}

// Event listener for report generation
document.getElementById('generate-booking-report').addEventListener('click', generateBookingReport);
document.getElementById('generate-room-report').addEventListener('click', generateRoomAvailabilityReport);

// Load data on page load
window.onload = loadData;