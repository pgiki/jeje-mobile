/* eslint-disable no-extend-native */
import 'react-native-gesture-handler';
import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import App from './src/App';
import { storage } from './src/helpers';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
// Register background handler for messages
messaging().setBackgroundMessageHandler(async message => {
    storage.saveNotification(message);
    // console.log('Message handled in the background!', message);
});

function HeadlessCheck({ isHeadless }) {
    if (isHeadless) {
        // if App has been launched in the background by iOS, ignore
        return null;
    }
    return <App />;
}

AppRegistry.registerComponent(appName, () => HeadlessCheck);
if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root');
    AppRegistry.runApplication(appName, { rootTag });
}
