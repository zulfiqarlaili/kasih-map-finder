import React, { useState, useEffect } from 'react';
import Map from '@/components/Map';
import MerchantList from '@/components/MerchantList';
import { Merchant, MerchantWithDistance } from '@/types/merchant';
import { getCurrentPosition, sortMerchantsByDistance } from '@/utils/geoUtils';
import { toast } from '@/hooks/use-toast';
import merchantsData from '@/data/merchants.json';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Index = () => {
  const [merchants, setMerchants] = useState<(Merchant | MerchantWithDistance)[]>(merchantsData);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleFindNearMe = async () => {
    setIsLoadingLocation(true);
    
    try {
      const position = await getCurrentPosition();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      setUserLocation({ lat: userLat, lng: userLng });
      
      // Sort merchants by distance
      const merchantsWithDistance = sortMerchantsByDistance(merchantsData, userLat, userLng);
      setMerchants(merchantsWithDistance);
      
      toast({
        title: "Location found",
        description: `Found ${merchantsWithDistance.length} stores nearby. Showing closest first.`,
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
  };

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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-primary-foreground hover:bg-primary-hover"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="text-xl font-bold">MyKasih Store Finder</h1>
              <p className="text-sm text-primary-foreground/80">Find the nearest MyKasih partner stores in Malaysia</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
              <p className="text-sm font-medium">{merchants.length} Stores</p>
              <p className="text-xs text-primary-foreground/80">Across Malaysia</p>
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
            fixed md:relative z-20 w-80 h-full bg-card
            transition-transform duration-300 ease-in-out
            md:translate-x-0
          `}
        >
          <MerchantList
            merchants={merchants}
            selectedMerchant={selectedMerchant}
            onMerchantSelect={handleMerchantSelect}
            onFindNearMe={handleFindNearMe}
            isLoadingLocation={isLoadingLocation}
            userLocation={userLocation}
          />
        </aside>

        {/* Map Container */}
        <main 
          className={`
            flex-1 relative
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Attribution Footer */}
      <footer className="bg-muted p-2 text-xs text-muted-foreground text-center border-t border-border">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors | 
        Powered by <a href="https://maplibre.org/" target="_blank" rel="noopener noreferrer" className="underline">MapLibre</a>
      </footer>
    </div>
  );
};

export default Index;
