document.addEventListener('DOMContentLoaded', () => {
    const menuContainer = document.getElementById('menu-container');
    const menuItems = [
        { name: 'Add Booking', action: showAddBooking },
        { name: 'Manage Rooms', action: showManageRooms },
        { name: 'Check In', action: showCheckIn },
        { name: 'Check Out', action: showCheckOut },
        { name: 'Reports', action: showReports }
    ];

    function displayMenu() {
        menuContainer.innerHTML = '';
        menuItems.forEach(item => {
            const button = document.createElement('button');
            button.textContent = item.name;
            button.onclick = item.action;
            menuContainer.appendChild(button);
        });
    }

    function showAddBooking() {
        loadComponent('add-booking.html');
    }

    function showManageRooms() {
        loadComponent('manage-rooms.html');
    }

    function showCheckIn() {
        loadComponent('check-in.html');
    }

    function showCheckOut() {
        loadComponent('check-out.html');
    }

    function showReports() {
        loadComponent('reports.html');
    }

    function loadComponent(component) {
        fetch(`components/${component}`)
            .then(response => response.text())
            .then(html => {
                document.getElementById('main-content').innerHTML = html;
            })
            .catch(error => console.error('Error loading component:', error));
    }

    displayMenu();
});