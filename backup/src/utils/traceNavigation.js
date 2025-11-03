// traceNavigation.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

/**
 * Debug wrapper for NavigationContainer
 * Logs every mount, unmount, and whether it's independent
 */
export function TracedNavigationContainer(props) {
  console.log(
    '🧭 NavigationContainer MOUNTED — independent:',
    !!props.independent
  );

  React.useEffect(() => {
    console.log('✅ NavigationContainer rendered.');
    return () => console.log('🧹 NavigationContainer UNMOUNTED.');
  }, []);

  return <NavigationContainer {...props} />;
}
