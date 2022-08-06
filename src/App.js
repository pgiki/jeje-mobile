/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
import React, { Suspense, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import codePush from 'react-native-code-push';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider as ElementsProvider } from '@rneui/themed';
import { RecoilRoot } from 'recoil';
import { paperTheme, elementTheme } from './theme'
import { MainStack } from 'src/navigation';
import Notification from 'src/components/Notification';
import Loading from 'src/components/Loading';
import { setAuthorization, LocalizationProvider, LocalizationContext } from 'src/helpers';
import SplashScreen from 'react-native-splash-screen';
import { Linking } from 'react-native';
import VersionCheck from 'react-native-version-check';
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "exported from 'deprecated-react-native-prop-types'.",
])

function App(props) {
  const { i18n, loggedUser } = useContext(LocalizationContext);
  function onReady() {
    SplashScreen.hide();
    checkUpdates();
  };

  async function checkNotificationPerm() {
    // To check if the user has permission
    const status = await RNAndroidNotificationListener.getPermissionStatus()
    // status ='authorized|denied|unknown'
    if (status != 'authorized') {
      Alert.alert(
        i18n.t('Allow Notifications'),
        i18n.t('This feature will allow {appName} to automatically detect and process transaction related notifications', { appName: i18n.t('appName') }),
        [{ text: i18n.t('Dismiss') },
        {
          text: i18n.t('Open Settings'),
          onPress: RNAndroidNotificationListener.requestPermission,  // open store if update is needed.
        }]
      );
    }
  }

  async function checkUpdates() {
    try {
      const res = await VersionCheck.needUpdate();
      if (res.isNeeded) {
        Alert.alert(
          i18n.t('update your app').title(),
          i18n.t('Version {currentVersion} is outdated update to the lastest version {latestVersion}', res),
          [{ text: i18n.t('Dismiss') },
          {
            text: i18n.t('Update Now'), onPress: () => Linking.openURL(res.storeUrl),  // open store if update is needed.
          }]
        );
      }
    }
    catch (e) {
      console.log(e.message);
    }
  }

  useEffect(() => {
    // only ask for notification permission after they have logged In
    if (loggedUser) {
      setAuthorization(loggedUser.token);
      setTimeout(checkNotificationPerm, 45e3);
    }
  }, [loggedUser])

  return (
    <SafeAreaProvider>
      <LocalizationProvider>
        <ElementsProvider theme={elementTheme}>
          <PaperProvider theme={paperTheme}>
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
      </LocalizationProvider>
    </SafeAreaProvider>
  );
};

export default codePush(App);
