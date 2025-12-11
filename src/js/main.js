document.addEventListener("DOMContentLoaded", function() {
    // Initialize the application
    initApp();

    function initApp() {
        loadMainMenu();
    }

    function loadMainMenu() {
        fetch('components/main-menu.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('app').innerHTML = data;
                setupMenuListeners();
            });
    }

    function setupMenuListeners() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                loadComponent(target);
            });
        });
    }

    function loadComponent(component) {
        fetch(`components/${component}.html`)
            .then(response => response.text())
            .then(data => {
                document.getElementById('app').innerHTML = data;
                // Additional setup for specific components can be done here
                if (component === 'add-booking') {
                    setupBookingForm();
                } else if (component === 'check-in') {
                    setupCheckIn();
                } else if (component === 'check-out') {
                    setupCheckOut();
                } else if (component === 'reports') {
                    generateReports();
                }
            });
    }

    function setupBookingForm() {
        // Setup for booking form
    }

    function setupCheckIn() {
        // Setup for check-in process
    }

    function setupCheckOut() {
        // Setup for check-out process
    }

    function generateReports() {
        // Generate reports based on bookings
    }
});