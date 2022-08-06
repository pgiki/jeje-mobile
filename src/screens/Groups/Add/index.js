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
import { colors, utils, requests, url, width, height } from 'src/helpers';
import FlatListCustom from 'src/components/FlatList';
import { useRecoilState } from 'recoil';
import { Avatar, Input, Button } from '@rneui/themed';
import { ScrollView } from 'react-native-gesture-handler';
import { selectedUsersState } from 'src/atoms';
import _ from 'lodash';
import Modal from 'src/components/Modal';
import useStateRef from 'react-usestateref';

export default function GroupsAdd(props) {
  const {
    navigation,
    route: { params },
  } = props;

  const itemType = 'Group';
  const [itemURL, setItemURL] = useState(params?.itemURL);
  const [searchText, setSearchText] = useState(undefined);
  const [startURL, setStartURL] = useState(url.User);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [groupNameError, setGroupNameError] = useState('');

  const [selectedUsers, setSelectedUsers] = useRecoilState(selectedUsersState);
  const [permitted, setPermitted] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing, isEditingRef] = useStateRef(true);
  const [groupName, setGroupName] = useState('');
  const [modal, setModal] = useState({
    visible: false,
  });

  async function getPermitted() {
    try {
      const res = await requests.get(`${itemURL}users`);
      setPermitted(res);
    } catch (error) {
      // item not found more likely
    }
  }

  async function onSubmit() {
    try {
      const removeUsers = (
        _.difference(
          permitted?.results?.map(r => r.id) || [],
          selectedUsers.map(g => g.id)
        )
      );
      await requests.post(
        `${itemURL}assign_group/`,
        {
          add: {
            'permission__codename': `view_${itemType.split('.').slice(-1)[0]?.toLowerCase()}`,
            'users': selectedUsers.map(g => g.id),
          },
          remove: {
            users: removeUsers,
          },
        }
      );
      // remove unwanted item
      Alert.alert('Permissions Updated', 'The members of this group were updated successfully');
    } catch (error) {
      Alert.alert('Error updating Access', JSON.stringify(error?.data?.detail || error?.data || error.message));
    }
  }

  async function fetchItem() {
    try {
      const res = await requests.get(itemURL);
      setItem(res);
    } catch (error) {
      const msg = error.data?.detail || JSON.stringify(error.data || error.message);
      const actions = [{
        text: 'Dismiss', onPress: () => {
          if (msg.includes('Not found')) {
            navigation.pop();
          }
        },
      }];
      Alert.alert('Error Fetching Item', msg.includes('Not found') ? 'This item is no longer available or you do not have permission to access it' : msg, actions);
    }
  }
  function toggleEditGroupName(value = undefined) {
    setIsEditing(value !== undefined ? !isEditingRef.current : value);
  }

  useEffect(() => {
    if (permitted) {
      setSelectedUsers(
        permitted.results || []
      );
    }
  }, [permitted]);

  useEffect(() => {
    setSelectedUsers([]);
  }, []);

  useEffect(() => {
    if (itemURL) {
      setIsEditing(false);
      getPermitted();
      fetchItem();
    }
  }, [itemURL]);

  useEffect(() => {
    searchText !== undefined && setStartURL(`${url.User}?search=${searchText}`);
  }, [searchText]);

  useEffect(() => {
    if (item) {
      setGroupName(item.name);
      navigation.setOptions({
        title: item.name,
        headerRight: () => (
          <TouchableOpacity onPress={() => toggleEditGroupName(true)}>
            <Icon name="pencil" type="evilicon" size={25} />
          </TouchableOpacity>
        ),
      });
    }
  }, [item]);

  useEffect(() => {
    if (selectedUser) {
      setModal(
        { visible: true }
      );
    }
  }, [selectedUser]);

  function onPressSelectedUser(user) {
    setSelectedUser(user);
  }

  function removeFromSelected() {
    setSelectedUsers(selectedUsers.filter(s => s.id !== selectedUser?.id));
    setSelectedUser(null);
    setModal({ visible: false });
  }

  function openProfile(user) {
    const itemId = user?.profile_id;
    if (itemId) {
      navigation.navigate('Profiles/View', { itemId });
    } else {
      Alert.alert('No profile found', 'The profile does not exist or you lack permission to view it');
    }
  }

  async function updateGroupName() {
    if (!groupName) {
      return setGroupNameError('Please give your group a name');
    }
    groupNameError && setGroupNameError('');
    setLoading(true);
    if (itemURL) {
      try {
        const res = await requests.patch(itemURL, { name: groupName });
        Alert.alert('Name Updated', 'The name was updated successfully');
        setItem(res);
        toggleEditGroupName();
      } catch (error) {
        setGroupNameError(JSON.stringify(error.data));
      }
    } else {
      try {
        const res = await requests.post(url.Group, { name: groupName });
        setItem(res);
        setItemURL(
          url.getURL('Group', { type: 'detail', item: res })
        );
        toggleEditGroupName();
      } catch (error) {
        setGroupNameError(JSON.stringify(error.data));
      }
    }
    setLoading(false);
  }

  function onClosedModal() {
    setModal({ ...modal, visible: false });
    setSelectedUser(null);
  }

  return (
    <>
      <View style={style.root}>
        {!isEditingRef.current && <SearchBar
          platform={Platform.OS}
          placeholder={'Search...'}
          onChangeText={text => setSearchText(text)}
          value={searchText}
          searchIcon={{ name: 'search', type: 'evilicon' }}
          clearIcon={{ name: 'close', type: 'evilicon' }}
          cancelIcon={{ name: 'undo', type: 'evilicon', size: 30 }}
        />}
        {!!item?.id && !loading &&
          <View style={style.selectedItemsContainer}>
            {selectedUsers.length > 0 ? <ScrollView horizontal={true}>
              {selectedUsers.map(user => <TouchableOpacity
                key={user.id}
                style={style.selectedUser}
                onPress={() => onPressSelectedUser(user)}
              >
                <Avatar
                  size={'small'}
                  title={utils.getAvatarInitials(user.display_name)}
                />
                <Text style={style.selecteUserName}>{utils.truncate({ text: user.display_name, size: 12 })}</Text>
              </TouchableOpacity>)}
            </ScrollView> : <View>
              <Text>The group was created successful. Choose people to add</Text>
            </View>}
          </View>}

      </View>
      {isEditingRef.current ?
        <View style={style.editNameContainer}>
          <Input
            value={groupName}
            label={'Group Name'}
            onChangeText={(v) => setGroupName(v)}
            placeholder={'Enter Group Name'}
            multiline
            errorMessage={groupNameError}
          />
          <Button disabled={loading} title="Submit" onPress={updateGroupName} containerStyle={style.submitButtonContainer} />
        </View> :
        <FlatListCustom
          startURL={startURL}
          clearOnRefresh={true}
          ListEmptyComponent={() => (
            <View style={style.emptyListContainer}>
              <Text>{!searchText ? 'None of your contacts are currently using the app' : `No results match '${searchText}'`}</Text>
              <Button title={'Send Invitation'}
                onPress={() => navigation.navigate('Settings', { inviteFriends: true })}
                containerStyle={style.inviteButton}
              />
            </View>
          )}
          renderItem={p => <RenderUser {...p} openProfile={openProfile} />}
        />}
      {true && <Modal
        visible={modal?.visible || false}
        title={modal?.title}
        openType={'top'}
        extraProps={{
          onClosed: onClosedModal
        }}
      >
        <View>
          {!!selectedUser && <RenderUser item={selectedUser} hideCheckBox />}
          <ListItem onPress={() => openProfile(selectedUser)}>
            <Icon name="user" type="evilicon" />
            <ListItem.Content>
              <ListItem.Title>View Profile</ListItem.Title>
              <ListItem.Subtitle>Check their public profile</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem onPress={removeFromSelected}>
            <Icon name="trash" type="evilicon" />
            <ListItem.Content>
              <ListItem.Title>Remove</ListItem.Title>
              <ListItem.Subtitle>Remove from group</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>
      </Modal>}

      {!!item && <TouchableOpacity style={style.fixedButton} onPress={onSubmit}>
        <View style={style.fixedButtonIcon}>
          <Icon name="check" type="entypo" color={colors.white} size={30} />
        </View>
      </TouchableOpacity>}
    </>
  );
}

function RenderUser(props) {
  const { item, hideCheckBox } = props;
  const { id } = item;
  const name = item.display_name;
  const [selectedUsers, setSelectedUsers] = useRecoilState(selectedUsersState);
  const [checked, setChecked] = useState(selectedUsers.map(s => s.id).includes(id));

  function toggleChecked() {
    if (checked) {//uncheck
      setSelectedUsers(selectedUsers.filter(s => s.id !== id));
    } else {//check
      setSelectedUsers([...selectedUsers, item]);
    }
    setChecked(!checked);
  }

  useEffect(() => {
    const isChecked = selectedUsers.map(s => s.id).includes(id);
    if (isChecked !== checked) {
      setChecked(isChecked);
    }
  }, [selectedUsers]);

  function openProfile() {
    props.openProfile && props.openProfile(item);
  }

  return (
    <ListItem onPress={openProfile}>
      <Avatar title={utils.getAvatarInitials(name)} />
      <ListItem.Content>
        <ListItem.Title>{name}</ListItem.Title>
        <ListItem.Subtitle>{item.username}</ListItem.Subtitle>
      </ListItem.Content>
      {!hideCheckBox && <ListItem.CheckBox
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
      />}
    </ListItem>
  );
}

const style = StyleSheet.create({
  // root: { flex: 1 }
  mr10: { marginRight: 10 },
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
  headerRight: { marginRight: 15 },
  selectedUser: { paddingTop: 10, paddingLeft: 6, alignSelf: 'center', alignItems: 'center', paddingBottom: 3 },
  font12: { fontSize: 12 },
  editNameContainer: {
    backgroundColor: colors.white,
    marginTop: 50,
    margin: 10, padding: 10, paddingVertical: 50, borderRadius: 10,
  },
  submitButtonContainer: { marginTop: 20 },
  selectedItemsContainer: {
    margin: 5,
    backgroundColor: colors.white,
    borderRadius: 8, padding: 10,
    paddingHorizontal: 20,
  },
  selecteUserName: {
    fontSize: 11,
    color: colors.grey,
  },
  emptyListContainer: {
    margin: 10,
    paddingVertical: 50,
    alignItems: 'center',
  },
  inviteButton: {
    marginTop: 30,
    width: 0.6 * width,
  },
});
