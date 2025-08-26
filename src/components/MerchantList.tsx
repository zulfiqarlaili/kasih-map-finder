import React, { useState, useMemo, useEffect } from 'react';
import { Merchant, MerchantWithDistance } from '@/types/merchant';
import { formatAddress, getGoogleMapsUrl } from '@/utils/geoUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  ExternalLink, 
  MapPin, 
  Navigation,
  Filter,
  Zap
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  currentRadius = 5
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMoreVisible, setIsLoadingMoreVisible] = useState(false);

  // Get unique states and cities for filters
  const { states, cities } = useMemo(() => {
    const uniqueStates = [...new Set(merchants.map(m => m.state))].sort();
    const uniqueCities = [...new Set(merchants.map(m => m.city))].sort();
    return {
      states: uniqueStates,
      cities: uniqueCities
    };
  }, [merchants]);

  // Filter merchants based on search and filters
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

      const matchesState = stateFilter === 'all' || merchant.state === stateFilter;
      const matchesCityFilter = cityFilter === 'all' || merchant.city === cityFilter;

      return matchesSearch && matchesState && matchesCityFilter;
    });
  }, [merchants, searchTerm, stateFilter, cityFilter]);

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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm, stateFilter, cityFilter]);

  const hasDistance = (merchant: Merchant | MerchantWithDistance): merchant is MerchantWithDistance => {
    return 'distance' in merchant && typeof merchant.distance === 'number';
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-card to-card/80 backdrop-blur-xl border-r border-border/30">
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

        {/* Find Near Me Button */}
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

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="w-4 h-4 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold">
              Filters
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="text-xs rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All States</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="text-xs rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Merchant List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {visibleMerchants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="bg-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">No stores found</p>
              <p className="text-xs opacity-70">Try adjusting your search or filters</p>
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
      </ScrollArea>

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
      {userLocation && (
        <div className="p-4 border-t border-border/30 bg-gradient-to-r from-success/5 to-primary/5 flex-shrink-0">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Showing {merchants.length} stores within {currentRadius}km radius</span>
            </div>
            {hasMoreStores && (
              <p className="text-xs text-muted-foreground/70">
                More stores available beyond {currentRadius}km
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantList;