/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from 'react';
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
  Button,
} from '@rneui/themed';
import codePush from 'react-native-code-push';
import { utils, width, height, colors, font, url, LocalizationContext, requests } from 'src/helpers';
import Modal from 'src/components/Modal';

export default function Profile(props) {
  const { i18n, setAppLanguage, appLanguage } = useContext(LocalizationContext);
  const [loggedUser, setLoggedUser] = useState(utils.getUser());
  const [appInfo, setAppInfo] = useState();
  const [loading, setLoading] = useState(true);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const {
    navigation,
    route,
    route: { params },
  } = props;
  const id = loggedUser?.id;

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
      title: i18n.t('Download {appName}', { appName }),
      message: i18n.t('settings_download_invitation', { appName, firstName: loggedUser?.first_name || "You're" }),
      url: link.shortLink || 'https://onelink.to/jeje',
    });
    setIsGeneratingLink(false);
  };

  const onLogout = () => {
    utils.logout();
  };
  const onAccountDelete = () => {
    Alert.alert(
      i18n.t('Delete Account'),
      i18n.t('account_deletion_desc'),
      [{ text: i18n.t('Dismiss') }, {
        text: i18n.t('Submit'),
        onPress: async () => {
          await requests.post(url.User + 'delete_account/')
          Alert.alert(
            i18n.t('Delete Account'),
            i18n.t('account_deletion_success')
          )
        }
      }]
    );
  };

  const onContactSupport = () => {
    utils.requireLogin(
      () => {
        utils.privateChat({
          navigation,
          name: i18n.t('Customer Care'),
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
          title: i18n.t('Set Language'),
          subtitle: i18n.t(appLanguage || 'en'),
          icon: { name: 'earth', type: 'antdesign' },
          onPress: () => setIsLanguageModalVisible(!isLanguageModalVisible),
        },
        {
          title: i18n.t('Invite a Friend'),
          subtitle: isGeneratingLink
            ? i18n.t('Generating link Please wait')
            : i18n.t('Sharing is caring'),
          icon: { name: 'adduser', type: 'antdesign' },
          onPress: inviteFriends,
        },
        {
          title: i18n.t('About'),
          subtitle: appInfo
            ? `Version: ${appInfo.appVersion}, label: ${appInfo.label}`
            : i18n.t('Updated'),
          icon: { name: 'info', type: 'feather' },
          onPress: () => {
            // Updated: ${dayjs(appInfo.binaryModifiedTime).fromNow()}
            if (appInfo) {
              Alert.alert(
                i18n.t('App Info'),
                `Version: ${appInfo.appVersion}
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
          title: i18n.t('Terms and Conditions'),
          subtitle: i18n.t('All the stuff you should know'),
          icon: { name: 'clipboard', type: 'feather' },
          onPress: () => navigation.navigate('Web', { uri: url.tnc, title: i18n.t('Terms and Conditions') }),
        },
        {
          title: i18n.t('Privacy Policy'),
          subtitle: i18n.t('Important for both of us'),
          icon: { name: 'Safety', type: 'antdesign' },
          onPress: () => navigation.navigate('Web', { uri: url.privacy, title: i18n.t('Privacy Policy') }),
        },
        {
          title: i18n.t('Support'),
          subtitle: i18n.t('Ping us and we will give you a hand'),
          icon: { name: 'headphones', type: 'feather' },
          onPress: onContactSupport,
        },
        Platform.select({
          'ios': {
            title: i18n.t('Delete Account'),
            subtitle: i18n.t('Your account with all associated data will be delete'),
            icon: { name: 'trash', type: 'feather' },
            onPress: onAccountDelete,
          },
          default: null,
        }),
        {
          title: i18n.t('Log out'),
          subtitle: i18n.t('Once you logout, some cached data may be deleted'),
          icon: { name: 'logout', type: 'antdesign' },
          onPress: onLogout,
        },
      ].filter(i => !!i),
    },
  ];

  const avatar = loggedUser?.avatar;
  const editProfile = () => navigation.navigate('Auth/Profile');
  const languages = i18n.getAvailableLanguages();
  function changeLanguage(langCode) {
    setAppLanguage(langCode);
    setTimeout(() => setIsLanguageModalVisible(false), 10);
  }

  return (<>
    <ScrollView>
      <View style={style.root}>
        <View style={style.profileContainer}>
          {true && (
            <Avatar
              source={avatar ? { uri: avatar } : undefined}
              title={utils.getAvatarInitials(loggedUser?.display_name)}
              size={'medium'}
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
            <View key={`section - ${i}`}
            // style={style.sectionContainer}
            >
              {section.options.map((option, j) => (
                <ListItem
                  key={`item - ${i} - ${j}`}
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
    <Modal
      title={i18n.t('Language')}
      subtitle={i18n.t('Set Language')}
      modalHeight={0.5 * height}
      visible={isLanguageModalVisible}
      extraProps={{
        onClosed: () => setIsLanguageModalVisible(false),
      }}
    >

      {languages.map((langCode, index) => <Button
        title={i18n.t(langCode)}
        onPress={() => changeLanguage(langCode)}
        key={index}
        type={langCode === appLanguage ? 'solid' : 'outline'}
        containerStyle={style.languageContainer}
      />)}
    </Modal>
  </>
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
  languageContainer: { marginHorizontal: 20, marginVertical: 4 },
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
