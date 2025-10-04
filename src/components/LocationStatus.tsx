import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Wifi, Smartphone, Globe, Info, RefreshCw } from 'lucide-react';
import { detectInAppBrowser } from '@/utils/geoUtils';

interface LocationStatusProps {
  location: { lat: number; lng: number; accuracy: number; method: 'gps' | 'ip' } | null;
  onRefreshLocation: () => void;
  isLoadingLocation: boolean;
  getLocationButtonProps?: () => {
    text: string;
    action: () => void;
    icon: React.ReactNode;
  };
}

const LocationStatus: React.FC<LocationStatusProps> = ({ 
  location, 
  onRefreshLocation, 
  isLoadingLocation,
  getLocationButtonProps
}) => {
  const isInAppBrowser = detectInAppBrowser();

  const getLocationMethodInfo = () => {
    if (!location) return null;

    const methodInfo = {
      gps: {
        icon: <Smartphone className="w-4 h-4" />,
        label: 'GPS Location',
        color: 'bg-green-100 text-green-800 border-green-200',
        description: 'High accuracy location from your device GPS',
        accuracy: 'Very accurate'
      },
      ip: {
        icon: <Wifi className="w-4 h-4" />,
        label: 'IP Location',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Approximate location from your internet connection',
        accuracy: '~50km accuracy'
      }
    };

    return methodInfo[location.method];
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 100) return 'text-green-600';
    if (accuracy <= 1000) return 'text-yellow-600';
    if (accuracy <= 10000) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAccuracyLabel = (accuracy: number) => {
    if (accuracy <= 100) return 'Very High';
    if (accuracy <= 1000) return 'High';
    if (accuracy <= 10000) return 'Medium';
    if (accuracy <= 50000) return 'Low';
    return 'Very Low';
  };

  if (!location) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-full">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Location not set</p>
                <p className="text-sm text-muted-foreground">
                  Click "Find Me" to detect your location
                </p>
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={onRefreshLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Find Me
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const methodInfo = getLocationMethodInfo();
  const buttonProps = getLocationButtonProps ? getLocationButtonProps() : {
    text: "Refresh Location",
    action: onRefreshLocation,
    icon: <RefreshCw className="w-4 h-4" />
  };

  return (
    <div className="mb-4">
      {/* Compact Location Status */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${methodInfo?.color}`}>
            {methodInfo?.icon}
          </div>
          <div>
            <p className="text-sm font-medium">{methodInfo?.label}</p>
            <p className="text-xs text-muted-foreground">
              {getAccuracyLabel(location.accuracy)} accuracy
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={buttonProps.action}
          disabled={isLoadingLocation}
          className="h-8 w-8 p-0"
        >
          {isLoadingLocation ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            buttonProps.icon
          )}
        </Button>
      </div>

      {/* Only show critical warnings */}
      {isInAppBrowser && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800 mt-2">
          <Globe className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>In-App Browser:</strong> 
            <Button 
              variant="link" 
              className="p-0 h-auto text-amber-800 underline ml-1"
              onClick={() => {
                const currentUrl = window.location.href;
                window.open(currentUrl, '_system');
              }}
            >
              Open in browser
            </Button>
            for better location accuracy.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LocationStatus;
