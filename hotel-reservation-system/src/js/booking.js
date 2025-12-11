function addBooking(bookingDetails) {
    const bookings = getBookings();
    bookings.push(bookingDetails);
    saveBookings(bookings);
}

function getBookings() {
    const bookingsData = localStorage.getItem('bookings');
    return bookingsData ? JSON.parse(bookingsData) : [];
}

function saveBookings(bookings) {
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

function validateBookingForm(form) {
    const { guestName, roomNumber, checkInDate, checkOutDate } = form;
    if (!guestName.value || !roomNumber.value || !checkInDate.value || !checkOutDate.value) {
        alert("All fields are required.");
        return false;
    }
    return true;
}

function clearBookingForm(form) {
    form.reset();
}

document.getElementById('bookingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    if (validateBookingForm(this)) {
        const bookingDetails = {
            guestName: this.guestName.value,
            roomNumber: this.roomNumber.value,
            checkInDate: this.checkInDate.value,
            checkOutDate: this.checkOutDate.value,
            status: 'Booked'
        };
        addBooking(bookingDetails);
        clearBookingForm(this);
        alert("Booking added successfully!");
    }
});