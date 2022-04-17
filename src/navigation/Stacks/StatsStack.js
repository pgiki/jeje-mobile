/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { utils } from 'src/helpers';
import Stats from 'src/screens/Stats'
const Stack = createStackNavigator();

export function StatsStack() {
  const [loggedUser] = useState(utils.getUser());
  const [initialRoute, setInitialRoute] = useState(!loggedUser?.is_phone_verified ? 'Auth/Login' : 'Home');
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Group>
        <Stack.Screen
          name="Summary"
          component={Stats}
          options={({ route, navigation }) => ({
            title: 'Summary',
          })}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

