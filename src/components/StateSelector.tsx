import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { Merchant } from '@/types/merchant';

// Malaysian states with approximate center coordinates
const MALAYSIAN_STATE_CENTERS = {
  'Johor': { lat: 1.4854, lng: 103.7618 },
  'Selangor': { lat: 3.0738, lng: 101.5183 },
  'Perak': { lat: 4.5921, lng: 101.0901 },
  'Sarawak': { lat: 1.5533, lng: 110.3592 },
  'Sabah': { lat: 5.9804, lng: 116.0735 },
  'Negeri Sembilan': { lat: 2.7258, lng: 101.9424 },
  'Kedah': { lat: 6.1184, lng: 100.3685 },
  'Melaka': { lat: 2.1896, lng: 102.2501 },
  'Pahang': { lat: 3.8126, lng: 103.3256 },
  'Kelantan': { lat: 6.1254, lng: 102.2381 },
  'Terengganu': { lat: 5.3117, lng: 103.1324 },
  'W.P Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  'Penang': { lat: 5.4164, lng: 100.3327 },
  'Perlis': { lat: 6.4414, lng: 100.2048 },
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  'W.P Labuan': { lat: 5.2831, lng: 115.2308 },
  'W.P Putrajaya': { lat: 2.9264, lng: 101.6964 },
};

interface StateSelectorProps {
  selectedState: string | null;
  onStateChange: (state: string | null) => void;
  disabled?: boolean;
  merchants: Merchant[];
}

const StateSelector: React.FC<StateSelectorProps> = ({
  selectedState,
  onStateChange,
  disabled = false,
  merchants
}) => {
  // Calculate state counts dynamically from merchant data
  const stateData = useMemo(() => {
    const stateCounts = merchants.reduce((acc, merchant) => {
      acc[merchant.state] = (acc[merchant.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create array with counts, sorted by count descending
    return Object.entries(stateCounts)
      .map(([state, count]) => ({ 
        code: state, 
        name: state, 
        count,
        center: MALAYSIAN_STATE_CENTERS[state as keyof typeof MALAYSIAN_STATE_CENTERS] || { lat: 3.1390, lng: 101.6869 } // Default to KL
      }))
      .sort((a, b) => b.count - a.count);
  }, [merchants]);

  const totalStores = stateData.reduce((sum, state) => sum + state.count, 0);
  const handleValueChange = (value: string) => {
    if (value === 'all') {
      onStateChange(null);
    } else {
      onStateChange(value);
    }
  };

  const selectedStateData = stateData.find(state => state.code === selectedState);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <label className="text-sm font-medium text-foreground">
          Search by State
        </label>
      </div>
      
      <Select 
        value={selectedState || 'all'} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full rounded-xl border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background transition-all">
          <SelectValue placeholder="Select a state" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectItem value="all" className="font-medium">
            <div className="flex items-center justify-between w-full">
              <span>All States</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {totalStores}
              </Badge>
            </div>
          </SelectItem>
          
          {stateData.map((state) => (
            <SelectItem key={state.code} value={state.code}>
              <div className="flex items-center justify-between w-full">
                <span>{state.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {state.count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedStateData && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span>
            Showing stores in {selectedStateData.name} ({selectedStateData.count} stores)
          </span>
        </div>
      )}
    </div>
  );
};

export default StateSelector;
export { MALAYSIAN_STATE_CENTERS };
