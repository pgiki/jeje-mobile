/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { utils, LocalizationContext } from 'src/helpers';
import Camera from 'src/screens/Camera'
const Stack = createStackNavigator();

export function CameraStack() {
  const { i18n } = useContext(LocalizationContext);
  const [loggedUser] = useState(utils.getUser());
  const [initialRoute, setInitialRoute] = useState(!loggedUser?.is_phone_verified ? 'Auth/Login' : 'Home');
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Group>
        <Stack.Screen
          name="Scanner"
          component={Camera}
          options={({ route, navigation }) => ({
            title: i18n.t('QR Scanner'),
            headerShown: false,
          })}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

