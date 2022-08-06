/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Icon,
  SearchBar,
  ListItem,
} from '@rneui/themed';
// import axios from 'axios';
import { colors, utils, requests, url, width, height } from 'src/helpers';
import FlatListCustom from 'src/components/FlatList';
import { useRecoilState } from 'recoil';
import { Avatar } from '@rneui/themed';
import { ScrollView } from 'react-native-gesture-handler';
import { selectedGroupsState } from 'src/atoms';
import _ from 'lodash';
import Modal from 'src/components/Modal';

export default function Groups(props) {
  const {
    navigation,
    route: {
      params = {}
    },
  } = props;
  const { itemType = 'p2p.Portfolio', itemURL } = params;
  const [searchText, setSearchText] = useState(undefined);
  const [startURL, setStartURL] = useState(url.Group);
  const [selectedGroups, setSelectedGroups] = useRecoilState(selectedGroupsState);
  const [permitted, setPermitted] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modal, setModal] = useState({
    visible: false,
  });

  async function getPermitted() {
    try {
      const res = await requests.get(`${itemURL}permitted_users/`);
      setPermitted(res);
    } catch (e) {
      // alert(JSON.stringify(e.data))
    }
  }

  async function onSubmit() {
    try {
      const permittedGroups = permitted?.groups?.results?.map(r => r.item.id) || [];
      const addGroups = _.difference(
        selectedGroups.map(g => g.id),
        permittedGroups
      );

      const removeGroups = (
        _.difference(
          permittedGroups,
          selectedGroups.map(g => g.id)
        )
      );

      const permissions = [`view_${itemType.split('.').slice(-1)[0]?.toLowerCase()}`];
      const data = {
        add: {
          groups: addGroups,
          permissions,
        },
        remove: {
          groups: removeGroups,
          permissions,
        },
      };
      await requests.post(
        `${itemURL}assign_perm/`, data
      );
      Alert.alert('Permissions Updated', 'The permissions were shared successfully');
      navigation.pop();
    } catch (error) {
      Alert.alert('Error updating Access', JSON.stringify(error?.data?.detail || error?.data || error.message));
    }
  }

  useEffect(() => {
    // clear selected groups
    setSelectedGroups([]);
  }, []);

  useEffect(() => {
    if (permitted) {
      setSelectedGroups(
        permitted.groups.results.map(r => r.item)
      );
    }
  }, [permitted]);

  useEffect(() => {
    if (itemURL) {
      setTimeout(getPermitted, 200);
    }
  }, [itemURL]);

  useEffect(() => {
    searchText !== undefined && setStartURL(`${url.Group}?search=${searchText}`);
  }, [searchText]);

  useEffect(() => {
    navigation.setOptions({
      title: params?.title || 'Groups',
      headerRight: () => (
        <TouchableOpacity style={style.headerRight} onPress={() => editGroup()}>
          <Icon name="addusergroup" type="antdesign" size={20} />
        </TouchableOpacity>
      ),
    });
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      setModal(
        { visible: true }
      );
    }
  }, [selectedGroup]);

  function onPressSelectedGroup(group) {
    setSelectedGroup(group);
  }

  function removeFromSelected() {
    setSelectedGroups(selectedGroups.filter(s => s.id !== selectedGroup?.id));
    setSelectedGroup(null);
    setModal({ visible: false });
  }

  function editGroup(group) {
    navigation.navigate('Groups/Add', {
      itemURL: group?.id && url.getURL('Group', { type: 'detail', item: group }),
      itemType: 'Group',
    });
  }

  return (
    <>
      <View style={style.root}>
        <SearchBar
          platform={Platform.OS}
          placeholder={'Search and manage access...'}
          onChangeText={text => setSearchText(text)}
          value={searchText}
          //TODO: find a way to add them to the them
          searchIcon={{ name: 'search', type: 'evilicon' }}
          clearIcon={{ name: 'close', type: 'evilicon' }}
          cancelIcon={{ name: 'undo', type: 'evilicon', size: 30 }}
        />
        {selectedGroups.length > 0 && (
          <ScrollView
            contentContainerStyle={style.selectedItemsContainer}
            horizontal={true}>
            {selectedGroups.map(group => <TouchableOpacity
              key={group.id}
              style={style.selectedGroup}
              onPress={() => onPressSelectedGroup(group)}
            >
              <Avatar
                title={utils.getAvatarInitials(group.name)}
                icon={{ name: 'close', type: 'evilicon' }}
              />
              <Text style={style.font12}>{utils.truncate({ text: group.name, size: 12 })}</Text>
            </TouchableOpacity>)}
          </ScrollView>
        )}
      </View>
      <FlatListCustom
        startURL={startURL}
        clearOnRefresh={true}
        contentContainerStyle={style.listContainer}
        renderItem={p => <RenderGroup
          {...p}
          editGroup={editGroup}
          hideCheckBox={!itemURL}
        />}
      />
      {!!setSelectedGroup && <Modal
        visible={modal?.visible || false}
        title={modal?.title}
        openType={'top'}
        extraProps={{
          onClosed: () => {
            setSelectedGroup(null);
            setModal({ visible: false });
          },
        }}
      >
        <View>
          {!!selectedGroup && <RenderGroup item={selectedGroup} hideCheckBox />}
          <ListItem onPress={() => editGroup(selectedGroup)}>
            <Icon name="pencil" type="evilicon" />
            <ListItem.Content>
              <ListItem.Title>Edit Group</ListItem.Title>
              <ListItem.Subtitle>Managed Group Members</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem onPress={removeFromSelected}>
            <Icon name="trash" type="evilicon" />
            <ListItem.Content>
              <ListItem.Title>Remove</ListItem.Title>
              <ListItem.Subtitle>Remove Access to this item</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>
      </Modal>}

      {selectedGroups.length > 0 && <TouchableOpacity style={style.fixedButton} onPress={onSubmit}>
        <View style={style.fixedButtonIcon}>
          <Icon name="check" type="entypo" color={colors.white} size={30} />
        </View>
      </TouchableOpacity>}
    </>
  );
}

function RenderGroup(props) {
  const { item, hideCheckBox } = props;
  const { name, id } = item;
  const [selectedGroups, setSelectedGroups] = useRecoilState(selectedGroupsState);
  const [checked, setChecked] = useState(selectedGroups.map(s => s.id).includes(id));
  // const [_checked, set_checked] = useState(checked);

  function toggleChecked() {
    if (checked) {//uncheck
      setSelectedGroups(selectedGroups.filter(s => s.id !== id));
    } else {//check
      setSelectedGroups([...selectedGroups, item]);
    }
    setChecked(!checked);
  }

  useEffect(() => {
    const isChecked = selectedGroups.map(s => s.id).includes(id);
    if (isChecked !== checked) {
      setChecked(isChecked);
    }
  }, [selectedGroups]);

  function editGroup() {
    props.editGroup && props.editGroup(item);
  }

  return (
    <ListItem onPress={editGroup}>
      <Avatar title={utils.getAvatarInitials(name)} />
      <ListItem.Content>
        <ListItem.Title>{name}</ListItem.Title>
      </ListItem.Content>
      {!hideCheckBox ? <ListItem.CheckBox
        center
        checked={checked}
        onPress={toggleChecked}
        checkedIcon={
          <Icon
            name="checksquare"
            type="antdesign"
            color={colors.link}
            size={20}
            iconStyle={style.mr10}
          />
        }
        uncheckedIcon={
          <Icon
            name="checksquareo"
            type="antdesign"
            color="grey"
            size={20}
            iconStyle={style.mr10}
          />
        }
      /> : <ListItem.Chevron />}
    </ListItem>
  );
}

const style = StyleSheet.create({
  mr10: {
    marginRight: 10,
  },
  fixedButton: {
    position: 'absolute',

    bottom: Platform.select({
      ios: 40,
      default: 20,
    }),
    right: Platform.select({
      ios: 20,
      default: 15,
    }),


    backgroundColor: colors.primary,
    height: 45,
    width: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    alignSelf: 'center',
  },
  fixedButtonIcon: {
    alignSelf: 'center',
    marginTop: 8,
  },
  headerRight: {
    marginRight: 15,
  },
  selectedGroup: {
    paddingTop: 10,
    paddingLeft: 6,
    alignSelf: 'center',
    alignItems: 'center',
    paddingBottom: 3,
  },
  font12: { fontSize: 12 },
  selectedItemsContainer: {
    marginBottom: 10,
    marginTop: 6,
    minWidth: 0.97 * width,
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 6,
    paddingHorizontal: 20,
  },
  listContainer: {
    margin: 10,
    borderRadius: 20,
    minHeight: 0.9 * height,
    paddingBottom: 20,
  },
});
