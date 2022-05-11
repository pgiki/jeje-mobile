/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  View,
} from 'react-native';
import {
  Text,
  Icon,
  ListItem,
  Avatar,
  Divider,

} from 'react-native-elements';
import codePush from 'react-native-code-push';
import { utils, width, height, colors, font, url, appName } from 'src/helpers';

export default function Profile(props) {
  const [loggedUser, setLoggedUser] = useState(utils.getUser());
  const [appInfo, setAppInfo] = useState();
  const {
    navigation,
    route,
    route: { params },
  } = props;
  const id = loggedUser?.id;
  const [loading, setLoading] = useState(true);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  function openProfile() {
    const itemId = loggedUser?.profile_id;
    if (itemId) {
      navigation.navigate('Profiles/View', { itemId });
    } else {
      Alert.alert('No profile found', "More likely you haven't finished setting up your app. If this persists try to logout and then login again");
    }
  }


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // The screen is focused
      setLoggedUser(utils.getUser());
    });
    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    codePush.getUpdateMetadata().then(update => {
      if (update) {
        setAppInfo(update);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (params?.inviteFriends) {
      inviteFriends();
    }
  }, [params]);

  const inviteFriends = async () => {
    setIsGeneratingLink(true);
    const link = await utils.getDynamicLink({
      params: {
        page: 'Auth/Login',
        action: 'signup',
        referral: `invite_${loggedUser?.id || 0}`,
      },
    });
    await utils.share({
      title: `Download ${appName}`,
      message: `${loggedUser?.first_name || "You're"
        } invited you to download ${appName}. Track every penny`,
      url: link.shortLink || 'https://onelink.to/jeje',
    });
    setIsGeneratingLink(false);
  };

  const onLogout = () => {
    utils.logout();
    navigation.replace('Auth/Login');
  };

  const onContactSupport = () => {
    utils.requireLogin(
      () => {
        utils.privateChat({
          navigation,
          name: 'Customer Care',
          users: [loggedUser, { id: 19, username: 'admin' }],
        });
      },
      navigation,
      route,
    );
  };
  /*
About us
Terms and Conditions
Privacy


Wishlists (56)
Search Requests (12)

Chat with Us
Invite a friend

{
   "isPending": false,
   "bundlePath": "/CodePush/index.android.bundle",
   "isMandatory": true,
   "binaryModifiedTime": "1632237397499",
   "packageSize": 766045,
   "description": "Bug fixes",
   "downloadUrl": "https://codepushupdates.azureedge.net/storagev2/qccnUyrxcHr8kgAfzJyGHp5-rePD4c69d5d2-4fd5-41a7-87ee-98908f6b700c",
   "packageHash": "94e456c60b86ea47883871b7a133e105a44a93821b3f1829e89ccabbdd298f75",
   "deploymentKey": "SP_odcasEbhXqqXywxvtI76s0KYbUzFBWGKMSb",
   "label": "v16",
   "failedInstall": false,
   "appVersion": "0.0.5",
   "isFirstRun": true
}
  */
  const sections = [

    {
      options: [
        {
          title: 'Invite a Friend',
          subtitle: isGeneratingLink
            ? 'Generating link. Please wait...'
            : 'Sharing is caring',
          icon: { name: 'adduser', type: 'antdesign' },
          onPress: inviteFriends,
        },
        {
          title: 'About',
          subtitle: appInfo
            ? `Version: ${appInfo.appVersion}, label: ${appInfo.label}`
            : 'Updated',
          icon: { name: 'info', type: 'feather' },
          onPress: () => {
            // Updated: ${dayjs(appInfo.binaryModifiedTime).fromNow()}
            if (appInfo) {
              Alert.alert(
                'App Info',
                `
            Version: ${appInfo.appVersion}
            Label: ${appInfo.label} 
            Description: ${appInfo.description}
            `,
              );
            }
          },
        },
        //   ],
        // },
        // {
        //   name: 'Help',
        //   options: [
        {
          title: 'Terms and Conditions',
          subtitle: 'All the stuff you should know',
          icon: { name: 'clipboard', type: 'feather' },
          onPress: () => utils.openURL(url.tnc),
        },
        {
          title: 'Privacy Policy',
          subtitle: 'Important for both of us',
          icon: { name: 'Safety', type: 'antdesign' },
          onPress: () => utils.openURL(url.privacy),
        },
        {
          title: 'Support',
          subtitle: 'Ping us and we will give you a hand',
          icon: { name: 'headphones', type: 'feather' },
          onPress: onContactSupport,
        },
        //   ],
        // },
        // {
        //   options: [
        {
          title: 'Log out',
          subtitle: 'Once you logout, some cached data may be deleted',
          icon: { name: 'logout', type: 'antdesign' },
          onPress: onLogout,
        },
      ].filter(i => (loggedUser ? true : false)),
    },
  ];
  const avatar = loggedUser?.avatar;
  const editProfile = () => navigation.navigate('Auth/Profile');

  return (
    <ScrollView>
      <View style={style.root}>
        <View style={style.profileContainer}>
          {true && (
            <Avatar
              source={avatar ? { uri: avatar } : undefined}
              title={utils.getAvatarInitials(loggedUser?.display_name)}
              size={'medium'}
              onPress={openProfile}
            // style={style.avatar}
            />
          )}

          {!!loggedUser && (
            <View style={style.nameContainer}>
              <TouchableOpacity onPress={editProfile}>
                <Text numberOfLines={1} style={style.name}>
                  {loggedUser?.first_name || loggedUser?.username}{' '}{loggedUser?.last_name}
                  <Text><Icon name="pencil" type="evilicon" size={23} /></Text>
                </Text>
              </TouchableOpacity>
              <ListItem.Subtitle style={style.joinedDate}>
                Joined {utils.formatDate(loggedUser?.date_joined, 'll')}
              </ListItem.Subtitle>
            </View>
          )}

        </View>

        <View style={style.sectionsContainer}>
          <Divider />
          {sections.map((section, i) => (
            <View key={`section-${i}`}
            // style={style.sectionContainer}
            >
              {section.options.map((option, j) => (
                <ListItem
                  key={`item-${i}-${j}`}
                  bottomDivider
                  onPress={option.onPress}>
                  {!!option.icon && <Icon {...option.icon} size={35} color={colors.grey} />}
                  {!!option.renderIcon && option.renderIcon()}
                  <ListItem.Content>
                    <ListItem.Title>{option.title}</ListItem.Title>
                    <ListItem.Subtitle>{option.subtitle}</ListItem.Subtitle>
                  </ListItem.Content>
                  {!!option.onPress && false && <ListItem.Chevron />}
                </ListItem>
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const style = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionsContainer: {
    backgroundColor: colors.white,
    // paddingBottom:100,
    minHeight: 0.8 * height,
    marginHorizontal: 20
  },
  sectionContainer: {
    marginVertical: 20,
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 2,
  },
  biography: {
    paddingTop: 10,
  },
  horizontal: {
    flexDirection: 'row',
  },
  horizontalSpaceBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameContainer: {
    paddingLeft: 15,
  },
  profileContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    paddingBottom: 30,
    paddingTop: 10,
    paddingHorizontal: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  name: {
    fontFamily: font.medium,
    fontSize: 18,
  },
  joinedDate: {
    fontSize: 17,
    paddingTop: 4,
  },
  divider: {
    marginTop: 20,
    marginBottom: 20,
  },
  quoteContainer: {
    textAlign: 'left',
    marginVertical: 6,
  },
  itemsContainer: {
    paddingTop: 20,
  },
  realtorContainer: {
    maxWidth: 0.87 * width,
  },
  listingsContainer: {
    paddingTop: 15,
    flexDirection: 'row',
  },
  claimContainer: { marginTop: 10 },
  claimText: { color: colors.success, fontFamily: font.light },
  joinText: {
    color: colors.success,
    fontFamily: font.normal,
    fontSize: 18,
    // paddingLeft: 10,
  },
});
