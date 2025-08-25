import React, { useState, useMemo } from 'react';
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
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MerchantListProps {
  merchants: (Merchant | MerchantWithDistance)[];
  selectedMerchant?: Merchant | null;
  onMerchantSelect: (merchant: Merchant) => void;
  onFindNearMe: () => void;
  isLoadingLocation?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

const MerchantList: React.FC<MerchantListProps> = ({
  merchants,
  selectedMerchant,
  onMerchantSelect,
  onFindNearMe,
  isLoadingLocation = false,
  userLocation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

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

  const hasDistance = (merchant: Merchant | MerchantWithDistance): merchant is MerchantWithDistance => {
    return 'distance' in merchant && typeof merchant.distance === 'number';
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 space-y-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            MyKasih Stores
          </h2>
          <Badge variant="secondary" className="text-xs">
            {filteredMerchants.length} found
          </Badge>
        </div>

        {/* Find Near Me Button */}
        <Button
          onClick={onFindNearMe}
          disabled={isLoadingLocation}
          className="w-full bg-accent hover:bg-accent-hover text-accent-foreground font-medium"
          size="sm"
        >
          {isLoadingLocation ? (
            <>
              <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Finding your location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Find Near Me
            </>
          )}
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search stores, addresses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="w-4 h-4" />
            Filters
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
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
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredMerchants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No stores found matching your criteria.</p>
            </div>
          ) : (
            filteredMerchants.map((merchant) => (
              <Card
                key={merchant.merchantId}
                className={`cursor-pointer transition-all duration-200 hover:shadow-medium ${
                  selectedMerchant?.merchantId === merchant.merchantId
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onMerchantSelect(merchant)}
              >
                <CardContent className="p-3 space-y-3">
                  <div>
                    <h3 className="font-medium text-sm text-foreground leading-tight mb-1">
                      {merchant.tradingName}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {formatAddress(merchant)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        {merchant.state}
                      </Badge>
                      {hasDistance(merchant) && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          {merchant.distance}km away
                        </Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
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
                      Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {userLocation && (
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            📍 Showing distances from your location
          </p>
        </div>
      )}
    </div>
  );
};

export default MerchantList;