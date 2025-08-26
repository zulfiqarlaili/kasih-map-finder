import React, { useState, useEffect, useCallback } from 'react';
import Map from '@/components/Map';
import MerchantList from '@/components/MerchantList';
import { Merchant, MerchantWithDistance } from '@/types/merchant';
import { getCurrentPosition, sortMerchantsByDistance } from '@/utils/geoUtils';
import { toast } from '@/hooks/use-toast';
import merchantsData from '@/data/merchants.json';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu, X, MapPin, Loader2, List } from 'lucide-react';

const Index = () => {
  const [merchants, setMerchants] = useState<(Merchant | MerchantWithDistance)[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentRadius, setCurrentRadius] = useState(5); // Start with 5km radius
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreStores, setHasMoreStores] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

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
      
      // toast({
      //   title: "Location found",
      //   description: `Found ${nearbyStores.length} stores within 5km. Showing closest first.`,
      // });
      
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
      setIsMobileSheetOpen(false);
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
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Main Content */}
      <div className="flex-1 flex relative min-h-0 overflow-hidden">
        {/* Sidebar (hidden on mobile, visible on md+) */}
        <aside 
          className={`
            hidden md:block md:relative z-20 w-80 h-full bg-card/95 backdrop-blur-xl overflow-y-auto overscroll-contain
            border-r border-border/50 shadow-elegant
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
            flex-1 relative h-full overflow-hidden
            ${isSidebarOpen ? 'md:ml-0' : ''}
          `}
        >
          <Map
            merchants={merchants}
            selectedMerchant={selectedMerchant}
            onMerchantSelect={handleMerchantSelect}
            userLocation={userLocation}
          />

          {/* Mobile Floating Button to open Stores list */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsMobileSheetOpen(true)}
            className="md:hidden fixed bottom-4 right-4 z-30 rounded-full shadow-elegant"
          >
            <List className="w-5 h-5 mr-2" /> Stores
          </Button>
        </main>

        {/* Mobile Full-screen Sheet for Merchant List */}
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent side="bottom" className="p-0 h-[100dvh] md:hidden">
            <SheetHeader className="p-4 border-b border-border/30">
              <SheetTitle>Stores</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100dvh-61px)] overflow-hidden">
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
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Attribution Footer */}
      <footer className="bg-gradient-subtle p-3 text-xs text-muted-foreground text-center border-t border-border/30 backdrop-blur-sm">
        <p>© 2024 MyKasih Store Finder. Powered by OpenStreetMap contributors.</p>
      </footer>
    </div>
  );
};

export default Index;
