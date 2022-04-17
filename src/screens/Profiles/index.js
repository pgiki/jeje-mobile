import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Icon,
  Divider,
  SearchBar,
  Overlay,
  ListItem,
  ButtonGroup,
} from 'react-native-elements';
import { colors, font, utils, requests, url, width, height } from 'src/helpers';
import FlatListCustom from 'src/components/FlatList';

export default function Profiles(props) {
  const {
    navigation,
    route,
    route: { params },
  } = props;
  const loggedUser = utils.getUser();
  const [searchText, setSearchText] = useState('');
  const startURL = url.Profile;

  return (
    <>
      <View style={style.root}>
        <SearchBar
          platform={Platform.OS}
          placeholder={'Search...'}
          onChangeText={text => setSearchText(text)}
          value={searchText}
          searchIcon={{ name: 'search', type: 'evilicon' }}
          clearIcon={{ name: 'close', type: 'evilicon' }}
          cancelIcon={{ name: 'undo', type: 'evilicon', size: 30 }}
        />
      </View>
      <FlatListCustom
        startURL={startURL}
        clearOnRefresh={true}
        renderItem={p => <Text>Contact</Text>}
      />
    </>
  );
}

const style = StyleSheet.create({
  root: { flex: 1 }
})
