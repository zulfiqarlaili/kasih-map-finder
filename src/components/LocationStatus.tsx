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
    <div className="space-y-3 mb-4">
      {/* Location Status Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-full ${methodInfo?.color}`}>
                {methodInfo?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{methodInfo?.label}</p>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getAccuracyColor(location.accuracy)}`}
                  >
                    {getAccuracyLabel(location.accuracy)} Accuracy
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {methodInfo?.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                {location.accuracy > 1000 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Large search radius recommended due to low accuracy
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={buttonProps.action}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                buttonProps.icon
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* In-App Browser Warning */}
      {isInAppBrowser && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <Globe className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>In-App Browser Detected:</strong> For better location accuracy, 
            <Button 
              variant="link" 
              className="p-0 h-auto text-amber-800 underline ml-1"
              onClick={() => {
                const currentUrl = window.location.href;
                window.open(currentUrl, '_system');
              }}
            >
              open in your device's browser
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Location Tips */}
      {location.method === 'ip' && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>IP-based Location:</strong> Your location was determined from your internet connection. 
            For more accurate results, try enabling GPS in your browser settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Accuracy Improvement Tips */}
      {location.accuracy > 1000 && (
        <Alert className="border-orange-200 bg-orange-50 text-orange-800">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Low Accuracy Location:</strong> Consider enabling GPS in your browser settings for more precise store recommendations.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LocationStatus;
