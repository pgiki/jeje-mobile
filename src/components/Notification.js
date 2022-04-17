import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useNavigation } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
// import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import NotificationPopup from 'react-native-push-notification-popup';
import logo from 'src/assets/logo.png';
import dayjs from 'dayjs';
import { storage, DEBUG, appName, utils } from 'src/helpers';
// for recoil
import { notificationsState, localNotificationState } from 'src/atoms';
import { useRecoilState } from 'recoil';

async function saveTokenToDatabase(token) {
  // Assume user is already signed in
  // const user = auth().currentUser;
  // Add the token to the users datastore
  // console.log('Token is: ', token, 'user', user);
  storage.saveDeviceToken(token);
}

export default function Notification() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useRecoilState(notificationsState);
  const [localNotification] = useRecoilState(localNotificationState);
  const popup = useRef();
  async function requestUserPermission() {
    const authorizationStatus = await messaging().requestPermission();
    if (authorizationStatus) {
      /*
        On iOS, if your app wants to receive remote messages from FCM (via APNs),
        you must explicitly register with APNs if auto-registration has been disabled.
      */
      // messaging().registerDeviceForRemoteMessages();
    }
  }

  async function checkApplicationPermission() {
    const authorizationStatus = await messaging().requestPermission();
    if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED) {
      DEBUG && console.log('User has notification permissions enabled.');
    } else if (
      authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      DEBUG && console.log('User has provisional notification permissions.');
    } else {
      DEBUG && console.log('User has notification permissions disabled');
    }
  }

  function getDeviceToken() {
    const GET_FCM_TOKEN_FOR_ALL = true;
    if (Platform.OS === 'ios' && !GET_FCM_TOKEN_FOR_ALL) {
      messaging().getAPNSToken().then(saveTokenToDatabase);
    } else {
      messaging().getToken().then(saveTokenToDatabase);
    }
  }

  function showNotification({
    onPress,
    title,
    body,
    sentTime = 'Now',
    slideOutTime = 1e4,
  } = {}) {
    popup.current?.show({
      onPress,
      appIconSource: logo,
      appTitle: appName,
      timeText: sentTime,
      title,
      body,
      slideOutTime,
    });
  }

  const onMessage = async (message, status = 'read') => {
    if (!message) {
      return;
    }
    message.status = status;
    status === 'read' &&
      showNotification({
        ...message.notification,
        sentTime: dayjs(message.sentTime).fromNow(),
        onPress: () => {
          message.data.type &&
            navigation.navigate(message.data.type, utils.parseParams(message.data?.params || {})); // e.g. "Settings"
        },
      });
    // save notification locally
    setNotifications([...notifications, message]);
  };

  useEffect(() => {
    /* get clicked notification to open the app*/
    messaging()
      .getInitialNotification()
      .then(message => {
        onMessage(message);
      })
      .catch(error => null);
  }, []);

  useEffect(() => {
    if (localNotification) {
      showNotification({ ...localNotification });
    }
  }, [localNotification]);

  useEffect(() => {
    requestUserPermission();
  }, []);

  useEffect(() => {
    // Get the device token
    getDeviceToken();
    // Listen to whether the token changes
    messaging().onTokenRefresh(saveTokenToDatabase);
  }, []);

  //subscribe to receiving remote messages
  useEffect(() => {
    /* {
          "messageId": "1630266065210611",
          "data": {},
          "sentTime": "1630266065",
          "mutableContent": true,
          "notification": {
            "body": "Demo Message v3",
            "title": "Hi there"
          }
        }
      */
    return messaging().onMessage(onMessage);
  }, []);
  return <NotificationPopup ref={popup} />;
}
