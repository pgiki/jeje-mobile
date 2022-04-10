/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {View, StyleSheet } from 'react-native';
import {
Text,
} from 'react-native-elements';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import FastImage from 'react-native-fast-image';
// for notications
import {
  notificationsState,
} from 'src/atoms';
import { useRecoilState } from 'recoil';

import { utils } from 'src/helpers';
import Notifications from 'src/screens/Notifications';
import Home from 'src/screens/Home';

import Groups from 'src/screens/Groups';
import GroupsAdd from 'src/screens/Groups/Add';
import Profiles from 'src/screens/Profiles';

import Chats from 'src/screens/Chats';
import Chat from 'src/screens/Chats/Chat';

import Attachments from 'src/screens/Attachments';
import AttachmentsAdd from 'src/screens/Attachments/Add';

import Organizations from "src/screens/Organizations"
import OrganizationsView from "src/screens/Organizations/View"

import ProfilesView from 'src/screens/Profiles/View';

import AuthProfile from 'src/screens/Auth/Profile';
import Login from 'src/screens/Auth/Login';
import VerifyPhone from 'src/screens/Auth/VerifyPhone';
import Settings from 'src/screens/Settings';

import LoansApply from 'src/screens/Loans/Apply';
import Loans from 'src/screens/Loans';

import FinancialTips from "src/screens/FinancialTips"

import PortfoliosAdd from 'src/screens/Portfolios/Add';
import { font } from 'src/helpers';

const logo = require('src/assets/logo.png');
const Stack = createStackNavigator();

function LogoTitle() {
  return (
    <View style={style.logoContainer}>
      <FastImage style={style.searchFilter} source={logo} resizeMode={FastImage.resizeMode.contain} />
      <Text style={style.logoText}>iwezeshe</Text>
    </View>
  );
}

export default function MainStack() {

  const navigation = useNavigation();
  const [loggedUser] = useState(utils.getUser());
  // const [initialRoute, setInitialRoute] = useState("Attachments");
  const [initialRoute, setInitialRoute] = useState(!loggedUser?.is_phone_verified ? 'Auth/Login' : 'Home');
  const [notifications, setNotifications] = useRecoilState(notificationsState);

  const onMessage = remoteMessage => {
    if (remoteMessage) {
      setNotifications([...notifications, remoteMessage]);
      remoteMessage.data.type && setInitialRoute(remoteMessage.data.type); // e.g. "Settings"
    }
  };
  const handleDynamicLink = link => {
    //foreground: Handle dynamic link inside your own application
    /*console.log("dynamicLinks", link)
       {"minimumAppVersion": null, "url": "https://onelink.to/instadalali", "utmParameters": {"utm_campaign": "Download App", "utm_medium": "dynamic_link", "utm_source": "firebase"}}
      */
    // console.log("dynamicLinks", link);
    // https://onelink.to/instadalali?campaign=invite&id=2034&page=Listing
    if (link?.url) {
      const params = utils.getSearchParams(link?.url);
      if (params?.page) {
        navigation.navigate(params?.page, params);
      }
    }
  };

  useEffect(() => {
    // Assume a message-notification contains a "type" property in the data payload of the screen to open
    messaging().onNotificationOpenedApp(onMessage);
    // Check whether an initial notification is available
    messaging().getInitialNotification().then(onMessage);
    // If the application is in a background state or has fully quit then the getInitialLink
    dynamicLinks().getInitialLink().then(handleDynamicLink);
    //check referrals
    const unsubscribe = dynamicLinks().onLink(handleDynamicLink);
    return unsubscribe;
  }, []);

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Group>
        <Stack.Screen
          name="Home"
          component={Home}
          // initialParams={{ name: "Insta Dalali" }}
          options={({ route, navigation }) => ({
            title: '',
            headerLeft: props => <LogoTitle {...props} />,
          })}
        />

        <Stack.Screen
          name="Chats"
          component={Chats}
          options={({ route, navigation }) => ({
            title: 'Inbox',
          })}
        />
        <Stack.Screen
          name="Chat"
          component={Chat}
          options={({ route, navigation }) => ({
            title: 'Chat',
          })}
        />
        <Stack.Screen
          name="FinancialTips"
          component={FinancialTips}
          options={({ route, navigation }) => ({
            title: 'Niwezeshe Financial Tips',
          })}
        />
        <Stack.Screen
          name="Profiles"
          component={Profiles}
          options={({ route, navigation }) => ({
            title: 'Profiles',
          })}
        />
        <Stack.Screen
          name="Attachments"
          component={Attachments}
          options={({ route, navigation }) => ({
            title: 'Attachments',
          })}
        />
        <Stack.Screen
          name="Attachments/Add"
          component={AttachmentsAdd}
          options={({ route, navigation }) => ({
            title: 'Upload Document',
          })}
        />
        <Stack.Screen
          name="Organizations"
          component={Organizations}
          options={({ route, navigation }) => ({
            title: 'Organizations',
          })}
        />
        <Stack.Screen
          name="Organizations/View"
          component={OrganizationsView}
          options={({ route, navigation }) => ({
            title: 'Organization',
          })}
        />

        <Stack.Screen
          name="Groups"
          component={Groups}
          options={({ route, navigation }) => ({
            title: 'Groups',
          })}
        />
        <Stack.Screen
          name="Groups/Add"
          component={GroupsAdd}
          options={({ route, navigation }) => ({
            title: 'Add Group',
          })}
        />
        <Stack.Screen
          name="Profiles/View"
          component={ProfilesView}
          options={({ route, navigation }) => ({
            title: 'Profile',
          })}
        />

        <Stack.Screen
          name="Auth/VerifyPhone"
          component={VerifyPhone}
          options={({ route, navigation }) => ({
            title: 'Verify Phone Number',
          })}
        />
        <Stack.Screen
          name="Auth/Profile"
          component={AuthProfile}
          options={({ route, navigation }) => ({
            title: 'Profile',
          })}
        />

        <Stack.Screen
          name="Auth/Login"
          component={Login}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={({ route, navigation }) => ({
            title: 'Settings',
          })}
        />
        <Stack.Screen
          name="Notifications"
          component={Notifications}
          initialParams={{ name: 'Notifications' }}
        />

        <Stack.Screen
          name="Loans"
          component={Loans}
          options={({ route, navigation }) => ({
            title: 'Loans',
          })}
        />

        <Stack.Screen
          name="Loans/Apply"
          component={LoansApply}
          options={({ route, navigation }) => ({
            title: 'Apply for Loan',
          })}
        />

        <Stack.Screen
          name="Portfolios/Add"
          component={PortfoliosAdd}
          options={({ route, navigation }) => ({
            title: 'Manage Portfolio',
          })}
        />

      </Stack.Group>
    </Stack.Navigator>
  );
};

const style = StyleSheet.create({
  searchFilter: {
    width: 35, height: 45
  },
  logoContainer: {
    flexDirection: 'row'
  },
  logoText: {
    fontSize: 18,
    marginTop: 12,
    fontFamily:
      font.medium
  },

  horizontal: { flexDirection: 'row' },
  arrowBack: { marginRight: 10 },
});
