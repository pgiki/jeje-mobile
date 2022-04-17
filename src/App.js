/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
import React, { useState, Suspense } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider as ElementsProvider } from 'react-native-elements';
import { RecoilRoot } from 'recoil';
import { theme, elementTheme } from './theme'
import { MainStack } from 'src/navigation';
import Notification from 'src/components/Notification';
import Loading from 'src/components/Loading';
import { utils, setAuthorization } from 'src/helpers';


function App(props) {
  function onReady() {
    // hide splash then request tracking for ios
    const loggedUser = utils.getUser();
    if (loggedUser) {
      // initialize the token client here
      setAuthorization(loggedUser.token);
    }
    // SplashScreen.hide();
  };
  return (
    <SafeAreaProvider>
      <ElementsProvider theme={elementTheme}>
        <PaperProvider theme={theme}>
          <NavigationContainer onReady={onReady}>
            <RecoilRoot>
              <Suspense fallback={<Loading />}>
                <MainStack />
                <Notification />
              </Suspense>
            </RecoilRoot>
          </NavigationContainer>
        </PaperProvider>
      </ElementsProvider>
    </SafeAreaProvider>
  );
};
export default App;
