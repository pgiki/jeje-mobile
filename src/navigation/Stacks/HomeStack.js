/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {View, StyleSheet } from 'react-native';
import {Text} from 'react-native-paper';
import { createStackNavigator } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import { utils } from 'src/helpers';
import Notifications from 'src/screens/Notifications';
import Dashboard from 'src/screens/Dashboard'
// import Groups from 'src/screens/Groups';
// import GroupsAdd from 'src/screens/Groups/Add';

import Chats from 'src/screens/Chats';
import Chat from 'src/screens/Chats/Chat';

import Attachments from 'src/screens/Attachments';
import AttachmentsAdd from 'src/screens/Attachments/Add';
import ProfilesView from 'src/screens/Profiles/View';

import TransactionsAdd from 'src/screens/Transactions/Add';
import TransactionsView from 'src/screens/Transactions/View';

import AuthProfile from 'src/screens/Auth/Profile';
import Login from 'src/screens/Auth/Login';
import VerifyPhone from 'src/screens/Auth/VerifyPhone';
import Settings from 'src/screens/Settings';
const Stack = createStackNavigator();

export function HomeStack() {
  const [loggedUser] = useState(utils.getUser());
  const [initialRoute, setInitialRoute] = useState(!loggedUser?.is_phone_verified ? 'Auth/Login' : 'Dashboard');
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Group>
        <Stack.Screen
          name="Dashboard"
          component={Dashboard}
          options={({ route, navigation }) => ({
            // title: 'Chat',
            headerShown:false
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
          name="Transactions/Add"
          component={TransactionsAdd}
          options={({ route, navigation }) => ({
            title: 'Add Transaction',
          })}
        />
        <Stack.Screen
          name="Transactions/View"
          component={TransactionsView}
          options={({ route, navigation }) => ({
            title: 'View Transaction',
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
      </Stack.Group>
    </Stack.Navigator>
  );
};