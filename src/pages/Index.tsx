import React, { useState, useEffect, useCallback } from 'react';
import Map from '@/components/Map';
import MerchantList from '@/components/MerchantList';
import { Merchant, MerchantWithDistance } from '@/types/merchant';
import { getCurrentPosition, sortMerchantsByDistance } from '@/utils/geoUtils';
import { toast } from '@/hooks/use-toast';
import merchantsData from '@/data/merchants.json';
import { Button } from '@/components/ui/button';
import { Menu, X, MapPin, Loader2 } from 'lucide-react';

const Index = () => {
  const [merchants, setMerchants] = useState<(Merchant | MerchantWithDistance)[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentRadius, setCurrentRadius] = useState(5); // Start with 5km radius
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreStores, setHasMoreStores] = useState(true);

  // Load stores within current radius
  const loadStoresInRadius = useCallback((lat: number, lng: number, radius: number) => {
    const storesInRadius = sortMerchantsByDistance(merchantsData, lat, lng, radius);
    setMerchants(storesInRadius);
    setCurrentRadius(radius);
    
    // Check if there are more stores available beyond current radius
    const nextRadiusStores = sortMerchantsByDistance(merchantsData, lat, lng, radius + 5);
    setHasMoreStores(nextRadiusStores.length > storesInRadius.length);
    
    return storesInRadius;
  }, []);

  const handleFindNearMe = useCallback(async () => {
    setIsLoadingLocation(true);
    
    try {
      const position = await getCurrentPosition();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      setUserLocation({ lat: userLat, lng: userLng });
      
      // Start with 5km radius for better performance
      const nearbyStores = loadStoresInRadius(userLat, userLng, 5);
      
      toast({
        title: "Location found",
        description: `Found ${nearbyStores.length} stores within 5km. Showing closest first.`,
      });
      
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location access denied",
        description: "Please enable location access to find nearby stores.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingLocation(false);
    }
  }, [loadStoresInRadius]);

  // Auto check nearby (5km) on initial load
  useEffect(() => {
    handleFindNearMe();
  }, [handleFindNearMe]);

  const handleLoadMoreStores = useCallback(async () => {
    if (!userLocation || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const newRadius = currentRadius + 5;
      const moreStores = loadStoresInRadius(userLocation.lat, userLocation.lng, newRadius);
      
      toast({
        title: "More stores loaded",
        description: `Now showing ${moreStores.length} stores within ${newRadius}km.`,
      });
      
    } catch (error) {
      console.error('Error loading more stores:', error);
      toast({
        title: "Error loading stores",
        description: "Failed to load more stores. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [userLocation, isLoadingMore, currentRadius, loadStoresInRadius]);

  const handleMerchantSelect = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    // Close sidebar on mobile when merchant is selected
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground p-4 shadow-elegant backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-primary-foreground hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                MyKasih Store Finder
              </h1>
              <p className="text-sm text-primary-foreground/90">
                {userLocation 
                  ? `Showing stores within ${currentRadius}km radius` 
                  : "Find partner stores near you"
                }
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-right bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-sm font-medium">{merchants.length} Stores</p>
              <p className="text-xs text-primary-foreground/80">
                {userLocation ? `Within ${currentRadius}km` : "Available"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Sidebar */}
        <aside 
          className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed md:relative z-20 w-80 h-[calc(100vh-8rem)] bg-card/95 backdrop-blur-xl
            transition-all duration-500 ease-out
            md:translate-x-0 border-r border-border/50
            shadow-elegant
          `}
        >
          <MerchantList
            merchants={merchants}
            selectedMerchant={selectedMerchant}
            onMerchantSelect={handleMerchantSelect}
            onFindNearMe={handleFindNearMe}
            onLoadMore={handleLoadMoreStores}
            isLoadingLocation={isLoadingLocation}
            isLoadingMore={isLoadingMore}
            hasMoreStores={hasMoreStores}
            userLocation={userLocation}
            currentRadius={currentRadius}
          />
        </aside>

        {/* Map Container */}
        <main 
          className={`
            flex-1 relative h-[calc(100vh-8rem)]
            ${isSidebarOpen ? 'md:ml-0' : ''}
          `}
        >
          <Map
            merchants={merchants}
            selectedMerchant={selectedMerchant}
            onMerchantSelect={handleMerchantSelect}
            userLocation={userLocation}
          />
        </main>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-10 md:hidden transition-all duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Attribution Footer */}
      <footer className="bg-gradient-subtle p-3 text-xs text-muted-foreground text-center border-t border-border/30 backdrop-blur-sm">
        <p>© 2024 MyKasih Store Finder. Powered by OpenStreetMap contributors.</p>
      </footer>
    </div>
  );
};

export default Index;
