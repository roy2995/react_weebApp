import React from 'react';
import Map, { Marker } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapboxgl from 'mapbox-gl';

const LocationMap = ({ position }) => {
  // Set your Mapbox access token here
  mapboxgl.accessToken = 'pk.eyJ1IjoiYXN0cm9ib3lwdHkiLCJhIjoiY20xOW5sOWM4MDNkMjJsb21hMjY2c21zZSJ9.ZMO2CABl23ywu3-M0CMOew'; // Replace with your actual access token

  return (
    <div style={{ height: '400px', width: '100%', overflow: 'hidden', margin: '0 auto' }}>
      <Map
        initialViewState={{
          longitude: position.lon,
          latitude: position.lat,
          zoom: 17,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v10"
      >
        <Marker longitude={position.lon} latitude={position.lat} color="red" />
      </Map>
    </div>
  );
};

export default LocationMap;