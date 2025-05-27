console.log('navigation.js loaded successfully');

async function loadNodes(campus) {
    console.log('=== loadNodes called ===');
    console.log('Current page:', window.location.pathname);
    console.log('Campus parameter:', campus);

    const sourceSelect = document.getElementById('source');
    const destinationSelect = document.getElementById('destination');

    // Debug: Check if DOM elements are found
    if (!sourceSelect || !destinationSelect) {
        console.error('DOM elements not found:', {
            sourceSelect: !!sourceSelect,
            destinationSelect: !!destinationSelect
        });
        return;
    }

    console.log('Loading nodes for campus:', campus);

    // Reset dropdowns
    sourceSelect.innerHTML = '<option value="" disabled selected>Select a location</option>';
    destinationSelect.innerHTML = '<option value="" disabled selected>Select a location</option>';

    try {
        // Add timestamp to prevent caching
        const url = `/api/nodes?campus=${encodeURIComponent(campus)}&_=${Date.now()}`;
        console.log('Making request to:', url);

        // Add a timeout to the fetch request to avoid hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

        console.log('Sending fetch request...');
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            },
            signal: controller.signal,
            cache: 'no-store'
        });

        clearTimeout(timeoutId);
        console.log('Response status:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch nodes: ${response.status} ${response.statusText}`);
        }

        const nodes = await response.json();
        console.log('Received nodes:', nodes);

        if (!Array.isArray(nodes) || nodes.length === 0) {
            console.warn('No nodes returned for campus:', campus);
            sourceSelect.innerHTML = '<option value="" disabled>No locations available</option>';
            destinationSelect.innerHTML = '<option value="" disabled>No locations available</option>';
            return;
        }

        // Clear existing options
        sourceSelect.innerHTML = '<option value="" disabled selected>Select a location</option>';
        destinationSelect.innerHTML = '<option value="" disabled selected>Select a location</option>';

        // Populate dropdowns
        nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node;
            option.textContent = node;
            sourceSelect.appendChild(option.cloneNode(true));
            destinationSelect.appendChild(option);
        });
        console.log('Successfully populated dropdowns with', nodes.length, 'nodes');
    } catch (error) {
        console.error('Error in loadNodes:', error.name, error.message);
        console.error('Error stack:', error.stack);
        if (error.name === 'AbortError') {
            console.error('Request timed out after 5 seconds');
        }
        console.error('Check Network tab for request details');
        setTimeout(() => {
            sourceSelect.innerHTML = '<option value="" disabled>Error loading locations</option>';
            destinationSelect.innerHTML = '<option value="" disabled>Error loading locations</option>';
        }, 0);
    }
}

async function findPath() {
    // Get the current page URL to determine which campus we're on
    const currentPage = window.location.pathname.toLowerCase();
    let campus;
    
    if (currentPage.includes('deemed')) {
        campus = 'deemed';
    } else if (currentPage.includes('hill')) {
        campus = 'hill';
    } else if (currentPage.includes('outside') || currentPage.includes('outer')) {
        campus = 'outer';
    } else {
        console.error('Unknown campus type from URL:', currentPage);
        return;
    }

    const source = document.getElementById('source').value;
    const destination = document.getElementById('destination').value;
    const algorithm = document.getElementById('algorithm').value;
    const resultDiv = document.getElementById('path');

    // Debug: Log input values
    console.log('Finding path with inputs:', { source, destination, algorithm, campus });

    // Clear previous styles
    resultDiv.classList.remove('error');

    // Validate inputs
    if (!source || !destination) {
        resultDiv.innerHTML = 'Please select both source and destination.';
        resultDiv.classList.add('error');
        console.warn('Validation failed: Source or destination not selected');
        return;
    }
    if (source === destination) {
        resultDiv.innerHTML = 'Source and destination cannot be the same.';
        resultDiv.classList.add('error');
        console.warn('Validation failed: Source and destination are the same');
        return;
    }

    try {
        const url = `/api/navigate?from=${encodeURIComponent(source)}&to=${encodeURIComponent(destination)}&algorithm=${algorithm}&campus=${encodeURIComponent(campus)}`;
        console.log('Making request to:', url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(errorData[0] || `Network response was not ok: ${response.status}`);
        }

        const path = await response.json();
        console.log('Received path:', path);

        if (!Array.isArray(path) || path.length === 0) {
            resultDiv.innerHTML = 'No path found.';
            resultDiv.classList.add('error');
            console.warn('No path returned');
        } else {
            resultDiv.innerHTML = `Path: ${path.join(' → ')}`;
            console.log('Path displayed successfully');
        }
    } catch (error) {
        const errorMessage = error.message || 'An unknown error occurred';
        resultDiv.innerHTML = `Error: ${errorMessage}`;
        resultDiv.classList.add('error');
        console.error('Error in findPath:', error.name, error.message);
        if (error.name === 'AbortError') {
            console.error('Request timed out after 5 seconds');
        }
    }
}

// Load nodes when the script runs
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.toLowerCase();
    let campus;
    
    if (currentPage.includes('deemed')) {
        campus = 'deemed';
    } else if (currentPage.includes('hill')) {
        campus = 'hill';
    } else if (currentPage.includes('outside') || currentPage.includes('outer')) {
        campus = 'outer';
    } else {
        campus = 'outer'; // default to outer campus
    }
    
    loadNodes(campus);
});

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize WOW.js for animations
    new WOW().init();

    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');

    // Add click event listener to each navigation link
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor behavior
            
            // Get the target page from the href attribute
            const targetPage = this.getAttribute('href');
            
            // Add exit animation to current page
            document.body.classList.add('animate__animated', 'animate__fadeOut');
            
            // Wait for animation to complete then navigate
            setTimeout(() => {
                window.location.href = targetPage;
            }, 500);
        });
    });
});