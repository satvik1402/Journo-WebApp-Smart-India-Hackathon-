(async () => {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('Failed to fetch API key');
        }
        const config = await response.json();
        const apiKey = config.google_maps_api_key;

        if (apiKey) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } else {
            console.error('Google Maps API key not found.');
        }
    } catch (error) {
        console.error('Error loading Google Maps:', error);
    }
})();
