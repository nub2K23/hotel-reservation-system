// This file handles the check-in process, including updating booking statuses and managing room assignments.

document.addEventListener('DOMContentLoaded', function() {
    const checkInForm = document.getElementById('checkInForm');
    const bookingData = JSON.parse(localStorage.getItem('bookings')) || [];

    checkInForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const bookingId = document.getElementById('bookingId').value;
        const roomNumber = document.getElementById('roomNumber').value;

        const booking = bookingData.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'Checked In';
            booking.roomNumber = roomNumber;
            localStorage.setItem('bookings', JSON.stringify(bookingData));
            alert('Check-in successful for booking ID: ' + bookingId);
            checkInForm.reset();
        } else {
            alert('Booking ID not found. Please check and try again.');
        }
    });
});