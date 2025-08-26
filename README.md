# Kasih Map Finder

A modern, responsive web application for finding nearby stores and merchants with comprehensive location detection strategies.

## 🌟 Features

- **Interactive Map**: Built with MapLibre GL for smooth, responsive mapping
- **Smart Location Detection**: Multiple fallback strategies for location access
- **In-App Browser Support**: Special handling for social media in-app browsers
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Real-time Search**: Find stores within customizable radius
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components

## 🚀 Location Detection Strategies

### 1. GPS Location (Primary)
- High-accuracy location using device GPS
- Works in standard browsers with user permission

### 2. IP-based Geolocation (Fallback)
- Automatic fallback when GPS is unavailable
- Uses multiple IP geolocation services for redundancy
- Typical accuracy: ~50km radius
- Services used:
  - ipapi.co
  - ipapi.com
  - ipinfo.io
  - ipgeolocation.io
  - extreme-ip-lookup.com

### 3. Manual Location Input (User Fallback)
- Address input with geocoding
- Recent searches saved locally
- Quick location buttons for common areas
- OpenStreetMap Nominatim integration

## 🔧 In-App Browser Solutions

### Problem
Most in-app browsers (Facebook, Instagram, Threads, etc.) block geolocation APIs by default for security reasons.

### Solutions Implemented

#### 1. Automatic Detection
- Detects in-app browsers using user agent patterns
- Shows appropriate warnings and instructions
- Automatically suggests manual location input

#### 2. User Guidance
- Clear instructions for enabling location access
- Option to open in external browser
- Manual location input as primary fallback

#### 3. Progressive Enhancement
- Gracefully degrades when location isn't available
- Maintains functionality through alternative methods
- User-friendly error messages and suggestions

## 🛠️ Technical Implementation

### Location Detection Flow
```
1. Try GPS location (navigator.geolocation)
   ↓ (if fails)
2. Try IP-based location (multiple services)
   ↓ (if fails)
3. Prompt for manual input
   ↓
4. Use OpenStreetMap geocoding
```

### Browser Detection
- Comprehensive pattern matching for in-app browsers
- Supports 40+ social media and messaging platforms
- Real-time detection and user guidance

### Fallback Services
- Multiple IP geolocation APIs for redundancy
- Automatic failover between services
- Timeout handling and error recovery

## 📱 Mobile Optimization

- **Touch-friendly Interface**: Optimized for mobile devices
- **Responsive Layout**: Adapts to different screen sizes
- **Mobile Sheet**: Full-screen store list on mobile
- **Floating Action Buttons**: Easy access to key functions

## 🎨 UI Components

Built with shadcn/ui components:
- **Cards**: Location status and merchant information
- **Alerts**: Location warnings and tips
- **Badges**: Accuracy indicators and status
- **Buttons**: Action buttons with loading states
- **Inputs**: Address input with validation
- **Sheets**: Mobile-friendly overlays

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Modern web browser

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd kasih-map-finder

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

### Build for Production
```bash
npm run build
# or
bun run build
```

## 🔒 Privacy & Security

- **No API Keys Required**: Uses free, open services
- **Local Storage**: Recent searches stored locally only
- **HTTPS Required**: Secure location transmission
- **User Consent**: Clear permission requests

## 🌐 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **In-App Browsers**: Facebook, Instagram, Threads, etc.
- **Progressive Web App**: Installable on supported devices

## 📊 Performance Features

- **Lazy Loading**: Components load as needed
- **Efficient Rendering**: Optimized map markers and updates
- **Caching**: Location data cached appropriately
- **Responsive Images**: Optimized map tiles and icons

## 🔧 Configuration

### Environment Variables
```env
# Optional: Custom IP geolocation service
VITE_IP_GEOLOCATION_SERVICE=https://your-service.com/json
```

### Customization
- **Map Style**: Modify MapLibre GL configuration
- **Location Services**: Add/remove IP geolocation providers
- **UI Theme**: Customize Tailwind CSS variables
- **Geocoding**: Switch to different geocoding services

## 🐛 Troubleshooting

### Common Issues

#### Location Not Working
1. Check browser permissions
2. Try refreshing the page
3. Use manual location input
4. Open in external browser

#### In-App Browser Issues
1. Use manual location input
2. Copy link to external browser
3. Check social media app settings

#### Map Not Loading
1. Check internet connection
2. Verify OpenStreetMap accessibility
3. Clear browser cache

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **MapLibre GL**: Open-source mapping library
- **OpenStreetMap**: Free map data and tiles
- **shadcn/ui**: Beautiful UI components
- **Tailwind CSS**: Utility-first CSS framework
- **IP Geolocation Services**: Free location APIs

## 📞 Support

For support or questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review browser compatibility notes

---

**Note**: This application is designed to work around common in-app browser limitations while providing a seamless user experience across all platforms.
