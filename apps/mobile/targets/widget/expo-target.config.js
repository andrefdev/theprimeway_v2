/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'PrimeWayWidget',
  displayName: 'The Prime Way',
  icon: '../../assets/images/icon.png',
  colors: {
    $accent: { color: '#280FFB', darkColor: '#6454FD' },
    widgetBackground: { color: '#FFFFFF', darkColor: '#0A0A0F' },
  },
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.indrox.theprimeway'],
  },
};
