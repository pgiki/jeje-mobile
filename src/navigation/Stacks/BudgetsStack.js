/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Budgets from 'src/screens/Budgets';
import BudgetsAdd from 'src/screens/Budgets/Add';
import { utils } from 'src/helpers';
const Stack = createStackNavigator();

export function BudgetsStack() {
  const [loggedUser] = useState(utils.getUser());
  const [initialRoute, setInitialRoute] = useState(!loggedUser?.is_phone_verified ? 'Auth/Login' : 'Budgets');

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Group>
        <Stack.Screen
          name="Budgets"
          component={Budgets}
          options={({ route, navigation }) => ({
            title: 'Budgets',
          })}
        />
        <Stack.Screen
          name="Budgets/Add"
          component={BudgetsAdd}
          options={({ route, navigation }) => ({
            title: 'Budget',
          })}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};
