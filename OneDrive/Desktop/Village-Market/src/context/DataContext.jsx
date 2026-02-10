import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
    // Caching State
    const [shopsData, setShopsData] = useState([]);
    const [shopDetails, setShopDetails] = useState({}); // Cache by shop ID: { [id]: data }
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    // Use refs for non-state caches to prevent unnecessary re-renders
    const distanceCacheRef = useRef({});
    const shopsFetchTimeRef = useRef(0);
    const shopDetailFetchTimeRef = useRef({});
    
    const SHOPS_CACHE_DURATION = 30 * 1000; // 30 seconds
    const SHOP_DETAIL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // --- Fetch Shops (Cached on Backend & Frontend) with Smart TTL ---
    const getShops = useCallback(async (force = false) => {
        if (shopsData.length > 0 && !force && (Date.now() - shopsFetchTimeRef.current) < SHOPS_CACHE_DURATION) {
            return shopsData;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/shopkeepers');
            const data = await res.json();
            setShopsData(data);
            shopsFetchTimeRef.current = Date.now();
            return data;
        } catch (err) {
            console.error("Failed to fetch shops", err);
            return shopsData;
        } finally {
            setLoading(false);
        }
    }, [shopsData]);

    // --- Fetch Products (Paginated) ---
    const getProducts = useCallback(async (query = '', page = 1) => {
        try {
            const res = await fetch(`/api/products?search=${query}&page=${page}&limit=20`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(err);
            return [];
        }
    }, []);

    const getOffers = useCallback(async (force = false) => {
        // Offers are cached on backend for 30s
        const res = await fetch('/api/products/offers');
        const data = await res.json();
        return data;
    }, []);

    // --- Fetch Shop Detail (with caching by ID) ---
    const getShopDetail = useCallback(async (id, force = false) => {
        if (shopDetails[id] && !force) return shopDetails[id];

        try {
            const res = await fetch(`/api/shops/${id}`);
            const data = await res.json();
            setShopDetails(prev => ({ ...prev, [id]: data }));
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    }, [shopDetails]);

    // --- Calculate distance (with ref-based caching to avoid re-renders) ---
    const calculateDistance = useCallback(async (shopId, userLat, userLon) => {
        // Return cached distance if available
        if (distanceCacheRef.current[shopId] !== undefined) {
            return distanceCacheRef.current[shopId];
        }

        try {
            const res = await fetch('/api/distance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userLatitude: userLat,
                    userLongitude: userLon,
                    shopId: shopId
                })
            });

            if (!res.ok) {
                console.error('Distance calculation failed:', await res.json());
                return null;
            }

            const data = await res.json();
            // Cache using ref instead of state to avoid re-renders
            distanceCacheRef.current[shopId] = data;
            return data;
        } catch (err) {
            console.error('Error calculating distance:', err);
            return null;
        }
    }, []);

    // --- Calculate distances for multiple shops (batch) with smart caching ---
    const calculateDistances = useCallback(async (shopIds, userLat, userLon) => {
        try {
            // Filter out shops we already have distances for
            const uncachedIds = shopIds.filter(id => distanceCacheRef.current[id] === undefined);
            
            if (uncachedIds.length === 0) {
                // All distances are cached, return immediately
                return shopIds.map(id => distanceCacheRef.current[id]);
            }

            const res = await fetch('/api/distances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userLatitude: userLat,
                    userLongitude: userLon,
                    shopIds: uncachedIds
                })
            });

            if (!res.ok) {
                console.error('Batch distance calculation failed:', await res.json());
                return [];
            }

            const data = await res.json();
            // Cache all distances using ref
            data.distances.forEach(d => {
                distanceCacheRef.current[d.shopId] = d;
            });

            // Return all distances including cached ones
            return shopIds.map(id => distanceCacheRef.current[id] || null);
        } catch (err) {
            console.error('Error calculating distances:', err);
            return [];
        }
    }, []);

    // --- Preload Function ---
    const preloadShop = (id) => {
        if (!shopDetails[id]) {
            getShopDetail(id);
        }
    };

    // --- Get User Location (with caching) ---
    const getUserLocation = useCallback(async (force = false) => {
        if (userLocation && !force) {
            return userLocation;
        }

        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    setUserLocation(loc);
                    resolve(loc);
                },
                (err) => {
                    reject(err);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }, [userLocation]);

    // --- Clear stale cache periodically to prevent memory leaks ---
    useEffect(() => {
        const interval = setInterval(() => {
            distanceCacheRef.current = {};
            shopDetailFetchTimeRef.current = {};
        }, 10 * 60 * 1000); // Clear every 10 minutes

        return () => clearInterval(interval);
    }, []);

    return (
        <DataContext.Provider value={{
            shopsData,
            getShops,
            getProducts,
            getOffers,
            shopDetails,
            getShopDetail,
            preloadShop,
            loading,
            getUserLocation,
            calculateDistance,
            calculateDistances
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
}
