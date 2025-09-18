import React, { useState, useMemo, useEffect } from 'react';
import { Merchant, MerchantWithDistance } from '@/types/merchant';
import { formatAddress, getGoogleMapsUrl } from '@/utils/geoUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ExternalLink, 
  MapPin, 
  Navigation,
  Zap
} from 'lucide-react';

interface MerchantListProps {
  merchants: (Merchant | MerchantWithDistance)[];
  selectedMerchant?: Merchant | null;
  onMerchantSelect: (merchant: Merchant) => void;
  onFindNearMe: () => void;
  onLoadMore: () => void;
  isLoadingLocation?: boolean;
  isLoadingMore?: boolean;
  hasMoreStores?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  currentRadius?: number;
  searchMode?: 'proximity' | 'state';
  selectedState?: string | null;
}

const MerchantList: React.FC<MerchantListProps> = ({
  merchants,
  selectedMerchant,
  onMerchantSelect,
  onFindNearMe,
  onLoadMore,
  isLoadingLocation = false,
  isLoadingMore = false,
  hasMoreStores = false,
  userLocation,
  currentRadius = 5,
  searchMode = 'proximity',
  selectedState = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMoreVisible, setIsLoadingMoreVisible] = useState(false);

  // Filter merchants based on search
  const filteredMerchants = useMemo(() => {
    return merchants.filter(merchant => {
      const matchesSearch = searchTerm === '' || 
        merchant.tradingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.address1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.address2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.address3.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.postalCode.includes(searchTerm);

      return matchesSearch;
    });
  }, [merchants, searchTerm]);

  // Get visible merchants for pagination
  const visibleMerchants = useMemo(() => {
    return filteredMerchants.slice(0, visibleCount);
  }, [filteredMerchants, visibleCount]);

  // Check if there are more stores to load
  const hasMoreVisibleStores = visibleCount < filteredMerchants.length;

  // Handle loading more stores
  const handleLoadMoreVisibleStores = () => {
    if (hasMoreVisibleStores) {
      setIsLoadingMoreVisible(true);
      
      // Simulate loading delay for better UX
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 10, filteredMerchants.length));
        setIsLoadingMoreVisible(false);
      }, 300);
    }
  };

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm]);

  const hasDistance = (merchant: Merchant | MerchantWithDistance): merchant is MerchantWithDistance => {
    return 'distance' in merchant && typeof merchant.distance === 'number';
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 space-y-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              MyKasih Stores
            </h2>
          </div>
          <Badge variant="secondary" className="text-xs bg-accent/20 text-accent-foreground border border-accent/30">
            {filteredMerchants.length} found
          </Badge>
        </div>

        {/* Find Near Me Button - Only show in proximity mode */}
        {searchMode === 'proximity' && (
          <>
            <Button
              onClick={onFindNearMe}
              disabled={isLoadingLocation}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-primary-foreground font-medium rounded-xl shadow-elegant transition-all duration-300 hover:shadow-glow hover:scale-105"
              size="sm"
            >
              {isLoadingLocation ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Finding your location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Find Near Me ({currentRadius}km)
                </>
              )}
            </Button>

            {/* Load More Button - Only show when user has location and there are more stores */}
            {userLocation && hasMoreStores && (
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="w-full border-border/50 bg-background/50 hover:bg-background transition-all duration-300"
                size="sm"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Loading more stores...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Load More Stores (Expand to {currentRadius + 5}km)
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {/* State Search Info - Show in state mode */}
        {searchMode === 'state' && selectedState && (
          <div className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Showing all stores in <strong>{selectedState}</strong></span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search stores, addresses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background transition-all"
          />
        </div>

        {/* Filters removed */}
      </div>

      {/* Merchant List */}
      <div className="p-3 space-y-3">
          {visibleMerchants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">No stores found</p>
              <p className="text-xs opacity-70">Try adjusting your search</p>
            </div>
          ) : (
            visibleMerchants.map((merchant) => (
              <Card
                key={merchant.merchantId}
                className={`cursor-pointer transition-all duration-300 hover:shadow-elegant rounded-2xl overflow-hidden border-border/30 ${
                  selectedMerchant?.merchantId === merchant.merchantId
                    ? 'ring-2 ring-primary bg-gradient-to-r from-primary/10 to-accent/5 shadow-glow'
                    : 'hover:bg-gradient-to-r hover:from-muted/30 hover:to-background hover:scale-[1.02]'
                }`}
                onClick={() => onMerchantSelect(merchant)}
              >
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground leading-tight mb-2">
                      {merchant.tradingName}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {formatAddress(merchant)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs px-2 py-1 rounded-lg border-border/50 bg-background/50">
                        {merchant.state}
                      </Badge>
                      {hasDistance(merchant) && (
                        <Badge className="text-xs px-2 py-1 border border-success/30 rounded-lg">
                          {merchant.distance}km away
                        </Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs border-border/50 bg-background/50 hover:bg-primary hover:text-primary-foreground hover:border-primary rounded-xl transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          getGoogleMapsUrl(merchant.latitude, merchant.longitude),
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Maps
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
      </div>

      {/* Load More Stores Progress */}
      {filteredMerchants.length > 0 && (
        <div className="p-3 border-t border-border/30 bg-gradient-to-r from-muted/20 to-background/20 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Showing {visibleMerchants.length} of {filteredMerchants.length} stores</span>
            <span>{Math.round((visibleMerchants.length / filteredMerchants.length) * 100)}% loaded</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted/30 rounded-full h-2 mb-3">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${(visibleMerchants.length / filteredMerchants.length) * 100}%` }}
            />
          </div>

          {/* Load More Button */}
          {hasMoreVisibleStores && (
            <Button
              onClick={handleLoadMoreVisibleStores}
              disabled={isLoadingMoreVisible}
              variant="outline"
              className="w-full border-border/50 bg-background/50 hover:bg-background transition-all duration-300"
              size="sm"
            >
              {isLoadingMoreVisible ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Loading more stores...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Load More Stores ({Math.min(10, filteredMerchants.length - visibleMerchants.length)} more)
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      {(userLocation || searchMode === 'state') && (
        <div className="p-4 border-t border-border/30 bg-gradient-to-r from-success/5 to-primary/5 flex-shrink-0">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              {searchMode === 'proximity' && userLocation ? (
                <span>Showing {merchants.length} stores within {currentRadius}km radius</span>
              ) : searchMode === 'state' && selectedState ? (
                <span>Showing {merchants.length} stores in {selectedState}</span>
              ) : (
                <span>Showing {merchants.length} stores</span>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex flex-col items-center space-y-2 text-center">
                {searchMode === 'proximity' && (
                  <p className="text-xs text-muted-foreground/70">
                    More stores available beyond this area
                  </p>
                )}
                {searchMode === 'state' && (
                  <p className="text-xs text-muted-foreground/70">
                    Switch to "Near Me" to find stores by your location
                  </p>
                )}
                <div className="flex items-center space-x-2 text-xs text-muted-foreground/60">
                  <span>Built with ❤️ by</span>
                  <a 
                    href="https://210391.xyz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    zulfiqar
                  </a>
                </div>
                <p className="text-xs text-muted-foreground/50">
                  © {new Date().getFullYear()} MyKasih Store Finder. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MerchantList;