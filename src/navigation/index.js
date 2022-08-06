import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { BudgetsStack, HomeStack, CameraStack, StatsStack } from './Stacks';
// import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useRecoilState } from 'recoil';
import { notificationsState } from 'src/atoms';
import messaging from '@react-native-firebase/messaging';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { colors, LocalizationContext, utils, font } from 'src/helpers';
import { Icon, Text } from '@rneui/themed';


const Tab = createMaterialBottomTabNavigator();

export function MainStack() {
    const { i18n, loggedUser } = useContext(LocalizationContext);
    const navigation = useNavigation();
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

    if (!loggedUser) return <HomeStack />

    return (
        <Tab.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ tabBarHideonKeyboard: true, labelStyle: { color: "blue", }, }}
        // barStyle={{ backgroundColor: 'white' }}
        // activeColor={colors.primary}
        // inactiveColor={colors.black}
        // activeColor="#f0edf6"
        // inactiveColor="#3e2465"
        // barStyle={{ backgroundColor: '#694fad' }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{
                    tabBarLabel: <Text style={style.label}>{i18n.t('Home')}</Text>,
                    tabBarIcon: ({ color, focused }) => (
                        <Icon name="home-outline" color={focused ? colors.primary : color} size={26} type={'ionicon'} />
                    ),
                }}

            />
            <Tab.Screen
                name="Camera"
                component={CameraStack}
                options={{
                    tabBarLabel: <Text style={style.label}>{i18n.t('Scanner')}</Text>,
                    tabBarIcon: ({ color, focused }) => (
                        <Icon name="line-scan" type='material-community' size={26} color={focused ? colors.primary : color} />
                    ),
                }}
            />

            <Tab.Screen
                name="Stats"
                component={StatsStack}
                options={{
                    tabBarLabel: <Text style={style.label}>{i18n.t('Summary')}</Text>,
                    tabBarIcon: ({ color, focused }) => (
                        <Icon color={focused ? colors.primary : color} name="linechart" type='antdesign' size={26} />
                    ),
                }}
            />
            <Tab.Screen
                name="BudgetsStack"
                component={BudgetsStack}
                options={{
                    tabBarLabel: <Text style={style.label}>{i18n.t('Budgets')}</Text>,
                    tabBarIcon: ({ color, focused }) => (
                        <Icon color={focused ? colors.primary : color} name="dollar-sign" type='feather' size={26} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const style = StyleSheet.create({
    label: {
        fontSize: 12
    }
})