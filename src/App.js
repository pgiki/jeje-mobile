/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import {Footer} from './components/Footer';
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'tomato',
    accent: 'yellow',
  },
};

function App(props) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
  <NavigationContainer>
    <PaperProvider theme={theme}>
      <SafeAreaView>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Footer />
      </SafeAreaView>
    </PaperProvider>
  </NavigationContainer>
  );
};
export default App;
