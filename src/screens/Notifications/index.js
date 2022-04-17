/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity, Alert,
} from 'react-native';
import { Text, ListItem, Divider, Tab, TabView } from 'react-native-elements';
import { colors, utils, font } from 'src/helpers';
import { useRecoilState } from 'recoil';
import { notificationsState } from 'src/atoms';
import dayjs from 'dayjs';
import Chats from 'src/screens/Chats';

export default function Notifications(props) {

  const [results, setResults] = useRecoilState(notificationsState);
  const [refreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabIndex, setTabIndex] = React.useState(0);
  const { navigation } = props;

  const onPressItem = ({ item }) => {
    if (item?.data?.type) {
      navigation.navigate(item.data.type, utils.parseParams(item.data?.params || {})); // e.g. "Settings"
    } else {
      // show a popu with more details about the notification,parse the text
      return Alert.alert(item?.notification?.title || 'No title', item?.notification?.body || 'No body');
    }
  };

  const onRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 5000);
  };

  useEffect(() => {
    // mark all messages read when exit this component;
    navigation.setOptions({
      title: 'Inbox',
    });
    return () => {
      setResults(
        results.map(item => {
          return { ...item, status: 'read' };
        }),
      );
    };
  }, []);

  return <View style={style.flex1}>
    <Tab
      value={tabIndex}
      onChange={(e) => setTabIndex(e)}
      indicatorStyle={style.tabIndicator}
      variant="primary"
    >
      <Tab.Item
        title="Notifications"
        titleStyle={style.tabTitle}
        containerStyle={style.tabItem}
      />
      <Tab.Item
        title="Chats"
        titleStyle={style.tabTitle}
        containerStyle={style.tabItem}
      />
    </Tab>

    <TabView value={tabIndex} onChange={setTabIndex} animationType="spring">
      <TabView.Item
        style={style.tabContainer}
        active={tabIndex === 0}
      >
        <View style={style.root}>
          <FlatList
            ListEmptyComponent={
              <View style={style.flex1}>
                <Text>
                  You are all set. You currently do not have any notifications
                </Text>
              </View>
            }
            onRefresh={onRefresh}
            // onEndReached={onEndReached}
            initialNumToRender={12}
            onEndReachedThreshold={0.75}
            refreshing={loading || refreshing}
            data={results}
            renderItem={({ item, index }) => (
              <RenderItem index={index} onPressItem={onPressItem} item={item} />
            )}
            keyExtractor={utils.keyExtractor}
          />
        </View>
      </TabView.Item>
      <TabView.Item
        style={style.tabContainer}
        active={tabIndex === 1}
      >
        <Chats />
      </TabView.Item>
    </TabView>
  </View>;
}

function RenderItem(props) {
  const { item, onPressItem } = props;
  const notification = item.notification;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={style.itemContainer}
      onPress={() => onPressItem({ item })}>
      <View style={style.horizontal}>
        <View>
          <ListItem.Title style={style.title}>
            {notification?.title}
          </ListItem.Title>
        </View>
        <View>
          <Text numberOfLines={1} style={style.time}>{dayjs(item?.sentTime).fromNow()}</Text>
        </View>
      </View>
      <ListItem.Subtitle>{notification?.body}</ListItem.Subtitle>
      <Divider style={style.divider} />
    </TouchableOpacity>
  );
}

const style = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  tabContainer: {
    width: '100%',
  },
  tabIndicator: {
    backgroundColor: colors.black,
    height: 3,
  },
  tabItem: { backgroundColor: colors.white },
  tabTitle: { fontSize: 12, color: colors.black, fontFamily: font.medium },
  textNoResults: {
    textAlign: 'center',
    marginTop: 50,
  },
  itemContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
    paddingVertical: 2,
  },
  divider: {
    paddingBottom: 10,
  },
  time: {
    fontSize: 13,
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  root: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.white,
  },
  add_search_text: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    color: colors.link,
  },
  add_icon: { marginTop: 3, color: colors.link },
  selected: {
    backgroundColor: 'rgb(230,230,230)',
  },
  unselected: {
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  text_center: {
    textAlign: 'center',
  },
  add_search_container: {
    flexDirection: 'row',
    marginRight: 10,
    borderColor: colors.link,
    borderRadius: 6,
    borderWidth: 0.4,
    margin: 4,
  },
  //places
  places: {
    flexDirection: 'row',
    paddingVertical: 10,
    flexWrap: 'wrap',
    marginBottom: 10,
    backgroundColor: 'rgb(240,240,240)',
  },
  place: {
    flexDirection: 'row',
    marginRight: 10,
    backgroundColor: 'rgb(248,248,248)',
    borderRadius: 6,
    borderWidth: 0.4,
    margin: 4,
  },
  place_name: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cancelIconPlaceName: {
    marginTop: 7,
    paddingRight: 2,
  },
  submit_button: {
    marginTop: 5,
    borderWidth: 0.8,
    paddingHorizontal: 20,
    borderRadius: 6,
    paddingVertical: 3,
    fontWeight: 'bold',
    color: colors.link,
    // alignItems:"flex-end",
  },
  search_text_add: {
    fontSize: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  submitText: {
    color: colors.link,
    fontFamily: font.bold,
    fontWeight: 'bold',
    fontSize: 16,
  },
  search_icon_add: {
    marginTop: 10,
  },
  font12: { fontSize: 12 },

});
