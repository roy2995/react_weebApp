import React, { useEffect, useState } from 'react';
import LocationMap from './LocationMap';

const GeolocationCheck = ({ desiredArea, onSuccess, onFailure }) => {
    const [userPosition, setUserPosition] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if geolocation is available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserPosition({ lat: latitude, lon: longitude });

                    // Check if the user is within the desired area
                    if (
                        latitude >= desiredArea.minLat &&
                        latitude <= desiredArea.maxLat &&
                        longitude >= desiredArea.minLon &&
                        longitude <= desiredArea.maxLon
                    ) {
                        onSuccess();
                    } else {
                        onFailure();
                    }
                },
                (err) => {
                    setError(err.message);
                    onFailure();
                }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
            onFailure();
        }
    }, [desiredArea, onSuccess, onFailure]);

    return (
        <div>
            {error && <p>Error: {error}</p>}
            {userPosition && <LocationMap position={userPosition} />}
        </div>
    );
};

export default GeolocationCheck;