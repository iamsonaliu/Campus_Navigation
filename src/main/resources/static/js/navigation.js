async function findPath() {
    const source = document.getElementById('source').value;
    const destination = document.getElementById('destination').value;
    const algorithm = document.getElementById('algorithm').value;
    const resultDiv = document.getElementById('path');

    // Clear previous styles
    resultDiv.classList.remove('error');

    // Validate inputs
    if (!source || !destination) {
        resultDiv.innerHTML = 'Please select both source and destination.';
        resultDiv.classList.add('error');
        return;
    }
    if (source === destination) {
        resultDiv.innerHTML = 'Source and destination cannot be the same.';
        resultDiv.classList.add('error');
        return;
    }

    try {
        const response = await fetch(`/api/navigate?from=${encodeURIComponent(source)}&to=${encodeURIComponent(destination)}&algorithm=${algorithm}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData[0] || `Network response was not ok: ${response.status}`);
        }
        const path = await response.json();
        if (!Array.isArray(path) || path.length === 0) {
            resultDiv.innerHTML = 'No path found.';
            resultDiv.classList.add('error');
        } else {
            resultDiv.innerHTML = `Path: ${path.join(' → ')}`;
        }
    } catch (error) {
        const errorMessage = error.message || 'An unknown error occurred';
        resultDiv.innerHTML = `Error: ${errorMessage}`;
        resultDiv.classList.add('error');
        console.error('Error:', error);
    }
}