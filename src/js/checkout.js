// This file manages the check-out process, including finalizing bookings and updating room availability.

document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkout-form');
    const bookingIdInput = document.getElementById('booking-id');
    const messageDiv = document.getElementById('message');

    checkoutForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const bookingId = bookingIdInput.value.trim();
        
        if (bookingId) {
            finalizeCheckout(bookingId);
        } else {
            displayMessage('Please enter a valid booking ID.', 'error');
        }
    });

    function finalizeCheckout(bookingId) {
        fetch('../data/bookings.json')
            .then(response => response.json())
            .then(bookings => {
                const booking = bookings.find(b => b.id === bookingId);
                if (booking) {
                    booking.status = 'Checked Out';
                    updateRoomAvailability(booking.roomId);
                    displayMessage(`Booking ID ${bookingId} has been checked out successfully.`, 'success');
                } else {
                    displayMessage('Booking ID not found.', 'error');
                }
            })
            .catch(error => {
                displayMessage('Error fetching booking data.', 'error');
                console.error('Error:', error);
            });
    }

    function updateRoomAvailability(roomId) {
        fetch('../data/rooms.json')
            .then(response => response.json())
            .then(rooms => {
                const room = rooms.find(r => r.id === roomId);
                if (room) {
                    room.available = true; // Mark room as available
                    // Here you would typically save the updated room data back to the server or local storage
                }
            })
            .catch(error => console.error('Error updating room availability:', error));
    }

    function displayMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = type; // 'success' or 'error'
    }
});