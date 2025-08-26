import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Wifi, 
  Smartphone, 
  Globe, 
  Info, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { 
  detectInAppBrowser, 
  getLocationInstructions,
  getLocationWithFallback 
} from '@/utils/geoUtils';
import { toast } from '@/hooks/use-toast';

const LocationDemo: React.FC = () => {
  const [isInAppBrowser] = useState(detectInAppBrowser());
  const [currentMethod, setCurrentMethod] = useState<'none' | 'gps' | 'ip' | 'manual'>('none');
  const [isTesting, setIsTesting] = useState(false);

  const testLocationMethod = async (method: 'gps' | 'ip') => {
    setIsTesting(true);
    try {
      const location = await getLocationWithFallback();
      setCurrentMethod(location.method);
      
      toast({
        title: "Location test successful",
        description: `Method: ${location.method}, Accuracy: ${location.accuracy}m`,
      });
    } catch (error) {
      toast({
        title: "Location test failed",
        description: "This method is not available in your current environment.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const locationMethods = [
    {
      id: 'gps',
      name: 'GPS Location',
      description: 'High-accuracy location using device GPS sensors',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'bg-green-100 text-green-800 border-green-200',
      accuracy: 'Very High (1-10m)',
      availability: 'Standard browsers',
      limitations: 'Requires user permission, blocked in in-app browsers',
      testable: true
    },
    {
      id: 'ip',
      name: 'IP Geolocation',
      description: 'Approximate location from internet connection',
      icon: <Wifi className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      accuracy: 'Low (~50km radius)',
      availability: 'All browsers and apps',
      limitations: 'Limited accuracy, depends on network location',
      testable: true
    },
    {
      id: 'manual',
      name: 'Manual Input',
      description: 'User-entered address with geocoding',
      icon: <MapPin className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      accuracy: 'Address-based',
      availability: 'All browsers and apps',
      limitations: 'Requires user input, depends on address quality',
      testable: false
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Location Detection Demo</h1>
        <p className="text-muted-foreground text-lg">
          See how Kasih Map Finder works around in-app browser limitations
        </p>
      </div>

      {/* In-App Browser Warning */}
      {isInAppBrowser && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <Globe className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>In-App Browser Detected:</strong> You're currently using an in-app browser 
            which blocks location access by default. This demo shows you how the app handles this limitation.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Current Location Method
          </CardTitle>
          <CardDescription>
            Your current location detection status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentMethod === 'none' ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No location method active</p>
              <p className="text-sm">Test a method below to see it in action</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              {locationMethods.find(m => m.id === currentMethod)?.icon}
              <div>
                <p className="font-medium">
                  {locationMethods.find(m => m.id === currentMethod)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Active and working
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Active
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Methods */}
      <div className="grid gap-6 md:grid-cols-3">
        {locationMethods.map((method) => (
          <Card key={method.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${method.color}`}>
                  {method.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{method.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {method.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className="font-medium">{method.accuracy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Availability:</span>
                  <span className="font-medium">{method.availability}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <p className="font-medium mb-1">Limitations:</p>
                <p>{method.limitations}</p>
              </div>

              {method.testable && (
                <Button
                  onClick={() => testLocationMethod(method.id as 'gps' | 'ip')}
                  disabled={isTesting}
                  className="w-full"
                  variant={currentMethod === method.id ? "default" : "outline"}
                >
                  {isTesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Testing...
                    </>
                  ) : currentMethod === method.id ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Active
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Test Method
                    </>
                  )}
                </Button>
              )}

              {!method.testable && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Manual Input Only
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Location Detection Works</CardTitle>
          <CardDescription>
            The app automatically tries different methods to get your location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Try GPS First</h4>
                <p className="text-sm text-muted-foreground">
                  Attempts to use device GPS for high-accuracy location
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Fallback to IP</h4>
                <p className="text-sm text-muted-foreground">
                  If GPS fails, uses IP address for approximate location
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Manual Input</h4>
                <p className="text-sm text-muted-foreground">
                  Asks user to enter location manually if all else fails
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* In-App Browser Solutions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            In-App Browser Solutions
          </CardTitle>
          <CardDescription>
            How the app handles social media in-app browsers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                What Works
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• IP-based location detection</li>
                <li>• Manual address input</li>
                <li>• Store search and mapping</li>
                <li>• All core app functionality</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                What's Blocked
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• GPS location access</li>
                <li>• Device sensors</li>
                <li>• High-accuracy positioning</li>
                <li>• Automatic location updates</li>
              </ul>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Pro Tip:</strong> For the best experience, open this app in your device's default browser 
              (Safari/Chrome) instead of social media in-app browsers.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Getting the Best Location Accuracy</CardTitle>
          <CardDescription>
            Tips for optimal location detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">For Standard Browsers:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Allow location access when prompted</li>
                <li>Ensure GPS is enabled on your device</li>
                <li>Use HTTPS (required for location access)</li>
              </ol>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">For In-App Browsers:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Use manual location input for best results</li>
                <li>Include city and state in your address</li>
                <li>Consider opening in external browser</li>
                <li>Use recent searches for quick access</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationDemo;
