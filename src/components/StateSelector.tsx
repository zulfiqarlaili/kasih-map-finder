import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, ChevronDown, Users, Store } from 'lucide-react';
import { Merchant } from '@/types/merchant';
import merchantsData from '@/data/merchants.json';

interface StateSelectorProps {
  onStateSelect: (state: string, center: { lat: number; lng: number }, merchants: Merchant[]) => void;
  currentState?: string;
}

// Malaysian states with their centers and merchant counts
const malaysianStates = {
  'johor': {
    name: 'Johor',
    center: { lat: 1.4927, lng: 103.7414 },
    count: merchantsData.filter(m => m.state === 'Johor').length
  },
  'kedah': {
    name: 'Kedah',
    center: { lat: 6.1254, lng: 100.3678 },
    count: merchantsData.filter(m => m.state === 'Kedah').length
  },
  'kelantan': {
    name: 'Kelantan',
    center: { lat: 6.1254, lng: 102.2381 },
    count: merchantsData.filter(m => m.state === 'Kelantan').length
  },
  'klang-valley': {
    name: 'Klang Valley',
    center: { lat: 3.1390, lng: 101.6869 },
    count: merchantsData.filter(m => 
      ['Kuala Lumpur', 'Selangor'].includes(m.state) ||
      ['Petaling Jaya', 'Shah Alam', 'Klang', 'Subang Jaya', 'Cheras', 'Ampang', 'Kepong'].some(city => 
        m.city?.toLowerCase().includes(city.toLowerCase())
      )
    ).length
  },
  'melaka': {
    name: 'Melaka',
    center: { lat: 2.1896, lng: 102.2501 },
    count: merchantsData.filter(m => m.state === 'Melaka').length
  },
  'negeri-sembilan': {
    name: 'Negeri Sembilan',
    center: { lat: 2.7258, lng: 101.9424 },
    count: merchantsData.filter(m => m.state === 'Negeri Sembilan').length
  },
  'pahang': {
    name: 'Pahang',
    center: { lat: 3.8077, lng: 103.3260 },
    count: merchantsData.filter(m => m.state === 'Pahang').length
  },
  'perak': {
    name: 'Perak',
    center: { lat: 4.5921, lng: 101.0901 },
    count: merchantsData.filter(m => m.state === 'Perak').length
  },
  'perlis': {
    name: 'Perlis',
    center: { lat: 6.4444, lng: 100.1987 },
    count: merchantsData.filter(m => m.state === 'Perlis').length
  },
  'penang': {
    name: 'Pulau Pinang',
    center: { lat: 5.4164, lng: 100.3327 },
    count: merchantsData.filter(m => m.state === 'Pulau Pinang').length
  },
  'sabah': {
    name: 'Sabah',
    center: { lat: 5.9788, lng: 116.0753 },
    count: merchantsData.filter(m => m.state === 'Sabah').length
  },
  'sarawak': {
    name: 'Sarawak',
    center: { lat: 1.5533, lng: 110.3591 },
    count: merchantsData.filter(m => m.state === 'Sarawak').length
  },
  'selangor': {
    name: 'Selangor',
    center: { lat: 3.3193, lng: 101.5185 },
    count: merchantsData.filter(m => m.state === 'Selangor').length
  },
  'terengganu': {
    name: 'Terengganu',
    center: { lat: 5.3117, lng: 103.1196 },
    count: merchantsData.filter(m => m.state === 'Terengganu').length
  }
};

const StateSelector: React.FC<StateSelectorProps> = ({ onStateSelect, currentState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStateSelect = (stateKey: string) => {
    const state = malaysianStates[stateKey as keyof typeof malaysianStates];
    if (state) {
      // Filter merchants for the selected state
      let filteredMerchants: Merchant[] = [];
      
      if (stateKey === 'klang-valley') {
        filteredMerchants = merchantsData.filter(m => 
          ['Kuala Lumpur', 'Selangor'].includes(m.state) ||
          ['Petaling Jaya', 'Shah Alam', 'Klang', 'Subang Jaya', 'Cheras', 'Ampang', 'Kepong'].some(city => 
            m.city?.toLowerCase().includes(city.toLowerCase())
          )
        );
      } else {
        filteredMerchants = merchantsData.filter(m => m.state === state.name);
      }
      
      onStateSelect(stateKey, state.center, filteredMerchants);
      setIsOpen(false); // Close dropdown immediately after selection
    }
  };

  const currentStateData = currentState ? malaysianStates[currentState as keyof typeof malaysianStates] : null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mobile/Compact View */}
      <div className="md:hidden">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-10"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="truncate">
              {currentStateData ? currentStateData.name : 'Pilih Negeri'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
        
        {isOpen && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto shadow-lg border-2">
            <CardContent className="p-2">
              <div className="space-y-1">
                {Object.entries(malaysianStates).map(([key, state]) => (
                  <Button
                    key={key}
                    variant={currentState === key ? "default" : "ghost"}
                    onClick={() => handleStateSelect(key)}
                    className="w-full justify-between h-auto p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{state.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {state.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Select value={currentState || ""} onValueChange={handleStateSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Negeri" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(malaysianStates).map(([key, state]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{state.name}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {state.count}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* State Info (when selected) */}
      {currentStateData && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="w-3 h-3" />
          <span>{currentStateData.count} kedai tersedia</span>
        </div>
      )}
    </div>
  );
};

export default StateSelector;
