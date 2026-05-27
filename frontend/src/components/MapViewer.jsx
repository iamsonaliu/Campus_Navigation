import React, { useEffect, useRef, useState } from 'react';

const MapViewer = ({ campusMode, setCampusMode }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const sourceMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [nodeData, setNodeData] = useState(new Map());
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [algorithm, setAlgorithm] = useState('bfs');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [pathResult, setPathResult] = useState([]);
  const [routeStats, setRouteStats] = useState(null);

  // Default coordinate centers for each campus
  const getCampusCenter = (campus) => {
    switch (campus) {
      case 'hill':
        return [30.2718, 77.9942]; // Exact GEHU Dehradun Hill campus coords
      case 'deemed':
        return [30.2730, 77.9955]; // Exact GEHU Deemed campus coords
      case 'outer':
        return [30.2710, 77.9930]; // Outer area
      default:
        return [30.2718, 77.9942];
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!window.L) {
      console.error('Leaflet is not loaded on window.');
      return;
    }

    const L = window.L;
    const center = getCampusCenter(campusMode);

    // Destroy existing map instance
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Initialize map
    const map = L.map(mapRef.current).setView(center, 17);
    mapInstance.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Clear previous refs
    markersRef.current = [];
    sourceMarkerRef.current = null;
    destinationMarkerRef.current = null;
    routePolylineRef.current = null;

    // Load nodes for selected campus
    fetchNodes(campusMode);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [campusMode]);

  // 2. Fetch Nodes list and details
  const fetchNodes = async (campus) => {
    setLoading(true);
    setErrorMessage('');
    setNodes([]);
    setSource('');
    setDestination('');
    setPathResult([]);
    setRouteStats(null);
    const newNodeData = new Map();
    setNodeData(newNodeData);

    try {
      // Fetch nodes list
      const listUrl = `/api/nodes?campus=${encodeURIComponent(campus)}&_=${Date.now()}`;
      const listResponse = await fetch(listUrl);
      if (!listResponse.ok) {
        throw new Error(`Failed to load nodes: ${listResponse.statusText}`);
      }
      const nodeNames = await listResponse.json();

      if (!Array.isArray(nodeNames) || nodeNames.length === 0) {
        setErrorMessage('No nodes available for this campus.');
        setLoading(false);
        return;
      }

      // Fetch details including coordinates
      const detailsUrl = `/api/node-details?campus=${encodeURIComponent(campus)}`;
      const detailsResponse = await fetch(detailsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(nodeNames)
      });

      if (!detailsResponse.ok) {
        throw new Error('Failed to load coordinates details');
      }

      const detailedNodes = await detailsResponse.json();
      const L = window.L;

      // Filter nodes with valid coordinates and draw markers
      const validNodes = [];
      detailedNodes.forEach((node) => {
        if (node.latitude && node.longitude) {
          validNodes.push(node.name);
          newNodeData.set(node.name, {
            lat: node.latitude,
            lng: node.longitude,
            name: node.name,
            description: node.description || '',
            type: node.type || ''
          });

          // Add simple marker to map
          const nodeIcon = L.divIcon({
            className: 'custom-node-marker',
            html: '<div style="background-color: #701a75; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          const marker = L.marker([node.latitude, node.longitude], { icon: nodeIcon })
            .addTo(mapInstance.current)
            .bindPopup(`<strong>${node.name}</strong><br/>${node.description || 'Campus Facility'}`);

          markersRef.current.push(marker);
        }
      });

      setNodes(validNodes.sort());
      setNodeData(newNodeData);

      // Fit map to show all markers
      if (markersRef.current.length > 0 && mapInstance.current) {
        const group = new L.featureGroup(markersRef.current);
        mapInstance.current.fitBounds(group.getBounds(), { padding: [30, 30] });
      }

    } catch (error) {
      console.error('Error fetching nodes:', error);
      setErrorMessage('Failed to load campus locations.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Source Change
  const handleSourceChange = (val) => {
    setSource(val);
    const L = window.L;

    if (sourceMarkerRef.current) {
      mapInstance.current.removeLayer(sourceMarkerRef.current);
      sourceMarkerRef.current = null;
    }

    if (val && nodeData.has(val)) {
      const node = nodeData.get(val);
      const sourceIcon = L.divIcon({
        className: 'custom-source-marker',
        html: '<div style="background-color: #22c55e; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">S</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      sourceMarkerRef.current = L.marker([node.lat, node.lng], { icon: sourceIcon })
        .addTo(mapInstance.current)
        .bindPopup(`<strong>Source: ${node.name}</strong>`);
      
      mapInstance.current.panTo([node.lat, node.lng]);
    }
  };

  // 4. Handle Destination Change
  const handleDestinationChange = (val) => {
    setDestination(val);
    const L = window.L;

    if (destinationMarkerRef.current) {
      mapInstance.current.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }

    if (val && nodeData.has(val)) {
      const node = nodeData.get(val);
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: '<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">D</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      destinationMarkerRef.current = L.marker([node.lat, node.lng], { icon: destIcon })
        .addTo(mapInstance.current)
        .bindPopup(`<strong>Destination: ${node.name}</strong>`);
      
      mapInstance.current.panTo([node.lat, node.lng]);
    }
  };

  // 5. Calculate Route Path
  const calculateRoute = async () => {
    if (!source || !destination) {
      setErrorMessage('Please select both source and destination.');
      return;
    }
    if (source === destination) {
      setErrorMessage('Source and destination cannot be the same.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setPathResult([]);
    setRouteStats(null);

    // Clear previous polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.forEach((layer) => mapInstance.current.removeLayer(layer));
      routePolylineRef.current = null;
    }

    try {
      const url = `/api/navigate?from=${encodeURIComponent(source)}&to=${encodeURIComponent(destination)}&algorithm=${algorithm}&campus=${encodeURIComponent(campusMode)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData[0] || 'Failed to fetch path routing.');
      }

      const path = await response.json();

      if (!Array.isArray(path) || path.length === 0) {
        setErrorMessage('No path found connecting these nodes.');
        return;
      }

      setPathResult(path);
      drawRoute(path);

    } catch (error) {
      console.error('Error navigating:', error);
      setErrorMessage(error.message || 'An unexpected routing error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Draw Route Polyline
  const drawRoute = (path) => {
    const L = window.L;
    const waypoints = path
      .filter((name) => nodeData.has(name))
      .map((name) => nodeData.get(name));

    if (waypoints.length < 2) return;

    const latlngs = waypoints.map((wp) => [wp.lat, wp.lng]);

    // Glow underlayer
    const glowLayer = L.polyline(latlngs, {
      color: '#d8b4fe',
      weight: 10,
      opacity: 0.3,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(mapInstance.current);

    // Core active route line
    const mainLine = L.polyline(latlngs, {
      color: '#701a75',
      weight: 4,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(mapInstance.current);

    routePolylineRef.current = [glowLayer, mainLine];

    // Auto fit map bounds around route
    mapInstance.current.fitBounds(mainLine.getBounds(), { padding: [50, 50] });

    // Calculate distance (Haversine)
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += calculateDistance(
        waypoints[i].lat, waypoints[i].lng,
        waypoints[i + 1].lat, waypoints[i + 1].lng
      );
    }

    const walkingTime = Math.ceil(totalDistance / 80); // Avg 80m per min
    setRouteStats({
      distance: totalDistance >= 1000 ? (totalDistance / 1000).toFixed(2) + ' km' : Math.round(totalDistance) + ' m',
      time: walkingTime
    });
  };

  // Haversine formula helper
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // 7. Clear Route
  const clearAllRoute = () => {
    setSource('');
    setDestination('');
    setErrorMessage('');
    setPathResult([]);
    setRouteStats(null);

    if (sourceMarkerRef.current) {
      mapInstance.current.removeLayer(sourceMarkerRef.current);
      sourceMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      mapInstance.current.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.forEach((layer) => mapInstance.current.removeLayer(layer));
      routePolylineRef.current = null;
    }

    // Reset view
    if (markersRef.current.length > 0) {
      const L = window.L;
      const group = new L.featureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds(), { padding: [30, 30] });
    }
  };

  return (
    <div id="map-viewer" className="map-viewer-container">
      <div className="section-header">
        <h2>Interactive Navigator</h2>
      </div>

      <div className="map-grid">
        {/* Map Panel */}
        <div className="map-card-wrapper">
          <div className="map-card-header">
            <h2><i className="fas fa-map-marked-alt"></i> GEHU Map</h2>
            <div className="campus-tabs">
              <button 
                className={`campus-tab-btn ${campusMode === 'deemed' ? 'active' : ''}`}
                onClick={() => setCampusMode('deemed')}
              >
                Deemed Campus
              </button>
              <button 
                className={`campus-tab-btn ${campusMode === 'hill' ? 'active' : ''}`}
                onClick={() => setCampusMode('hill')}
              >
                Hill Campus
              </button>
              <button 
                className={`campus-tab-btn ${campusMode === 'outer' ? 'active' : ''}`}
                onClick={() => setCampusMode('outer')}
              >
                Outside Area
              </button>
            </div>
          </div>
          <div ref={mapRef} id="map"></div>
        </div>

        {/* Controls Panel */}
        <div className="map-info-panel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            <div className="form-title">
              <i className="fas fa-compass" style={{ color: 'var(--brand-primary)' }}></i>
              <span>Plan Route</span>
            </div>

            <div className="controls-form">
              {/* Source Dropdown */}
              <div className="form-item">
                <label><i className="fas fa-map-marker-alt" style={{ color: '#22c55e' }}></i> Start Location</label>
                <select 
                  value={source} 
                  onChange={(e) => handleSourceChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select start node</option>
                  {nodes.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Destination Dropdown */}
              <div className="form-item">
                <label><i className="fas fa-flag-checkered" style={{ color: '#ef4444' }}></i> End Location</label>
                <select 
                  value={destination} 
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select destination node</option>
                  {nodes.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Algorithm Choice */}
              <div className="form-item">
                <label><i className="fas fa-bolt" style={{ color: 'var(--accent-gold)' }}></i> Optimization Method</label>
                <select 
                  value={algorithm} 
                  onChange={(e) => setAlgorithm(e.target.value)}
                  disabled={loading}
                >
                  <option value="bfs">BFS (Fewest Steps)</option>
                  <option value="dijkstra">Dijkstra (Shortest Metrical Distance)</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <i className="fas fa-exclamation-circle"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Path Result Details */}
            {pathResult.length > 0 && (
              <div className="path-details-card">
                <h4>📋 Route Roadmap</h4>
                <div className="path-display-text">
                  <span className="route-step-path">{pathResult.join(' → ')}</span>
                </div>
                {routeStats && (
                  <div className="route-stats-grid">
                    <span>Est. Distance: {routeStats.distance}</span>
                    <span>Walking Time: ~{routeStats.time} min</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="controls-btn-group" style={{ width: '100%' }}>
            <button 
              className="btn-primary" 
              onClick={calculateRoute}
              disabled={loading || !source || !destination}
            >
              {loading ? 'Finding...' : 'Find Route'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={clearAllRoute}
              disabled={loading}
            >
              Clear Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
