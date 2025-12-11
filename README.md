# Hotel Reservation System

## Overview
The Hotel Reservation System is a web-based application designed to manage hotel bookings, check-ins, check-outs, and reporting. It provides a user-friendly interface for hotel staff to efficiently handle reservations and room management.

## Features
- **Main Menu**: Navigate through different functionalities such as adding bookings, managing rooms, checking in and out guests, and generating reports.
- **Add Booking**: Input guest details and room preferences to create new bookings.
- **Manage Rooms**: View and update room availability and pricing.
- **Check-In**: Process guest check-ins and assign rooms.
- **Check-Out**: Finalize guest stays and update room availability.
- **Reports**: Generate insights into bookings and room occupancy.

## Project Structure
```
hotel-reservation-system
├── src
│   ├── index.html          # Main entry point of the application
│   ├── styles.css         # Styles for the application
│   ├── js
│   │   ├── main.js        # Initializes the application and manages state
│   │   ├── menu.js        # Handles main menu functionality
│   │   ├── booking.js     # Manages bookings and form validation
│   │   ├── checkin.js     # Handles guest check-in process
│   │   ├── checkout.js     # Manages guest check-out process
│   │   └── reports.js      # Generates reports on bookings and availability
│   ├── components
│   │   ├── main-menu.html  # HTML structure for the main menu
│   │   ├── add-booking.html # HTML for adding bookings
│   │   ├── manage-rooms.html # HTML for managing rooms
│   │   ├── check-in.html    # HTML for guest check-in
│   │   ├── check-out.html   # HTML for guest check-out
│   │   └── reports.html      # HTML for reports
│   └── data
│       ├── rooms.json       # Room data including types and availability
│       └── bookings.json     # Booking data including guest details
├── LICENSE                   # Licensing information
└── README.md                 # Project documentation
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Open the `index.html` file in a web browser to run the application.
3. Ensure that the `rooms.json` and `bookings.json` files are populated with initial data for testing.

## Usage Guidelines
- Use the main menu to navigate through the application.
- Follow prompts to add bookings, check in/out guests, and generate reports.
- Ensure to validate input data when adding bookings to avoid errors.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.