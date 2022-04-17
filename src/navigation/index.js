import React, { useEffect, useState } from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { BudgetsStack, HomeStack, StatsStack } from './Stacks';
// import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useRecoilState } from 'recoil';
import {notificationsState} from 'src/atoms';
import messaging from '@react-native-firebase/messaging';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { utils } from 'src/helpers';
import { colors } from 'src/helpers';
import { useMMKVString } from 'react-native-mmkv';

const Tab = createMaterialBottomTabNavigator();

export function MainStack() {
    const navigation = useNavigation();
    const [loggedUser, setLoggedUser] = useMMKVString('authUser')
    const [initialRoute, setInitialRoute] = useState(!loggedUser?.is_phone_verified ? 'Auth/Login' : 'Home');
    const [notifications, setNotifications] = useRecoilState(notificationsState);

    const onRemoteMessageReceived = remoteMessage => {
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
        messaging().onNotificationOpenedApp(onRemoteMessageReceived);
        // Check whether an initial notification is available
        messaging().getInitialNotification().then(onRemoteMessageReceived);
        // If the application is in a background state or has fully quit then the getInitialLink
        dynamicLinks().getInitialLink().then(handleDynamicLink);
        //check referrals
        const unsubscribe = dynamicLinks().onLink(handleDynamicLink);
        return unsubscribe;
    }, []);

    if(!loggedUser) return <HomeStack />

    return (
        <Tab.Navigator 
            initialRouteName={initialRoute}
            barStyle={{ backgroundColor: 'white'}}
            activeColor={colors.primary}
            inactiveColor={colors.black}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Stats" component={StatsStack} />
            <Tab.Screen name="BudgetsStack" component={BudgetsStack} 
                options={()=>({title:"Budgets"})} 
            />
        </Tab.Navigator>
    );
}