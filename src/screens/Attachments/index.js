/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Icon,
  SearchBar,
  ListItem, Image, Slider,
} from '@rneui/themed';
import FileViewer from 'react-native-file-viewer';
import RNFetchBlob from 'rn-fetch-blob';
// import Image from "react-native-fast-image"
// import axios from 'axios';
import { colors, url, utils, width, height, LocalizationContext } from 'src/helpers';
import FlatListCustom from 'src/components/FlatList';
import _ from 'lodash';
import Modal from 'src/components/Modal';
import { selectedAttachmentsState } from 'src/atoms';
import { useRecoilState } from 'recoil';

export default function Attachments(props) {
  const { i18n } = useContext(LocalizationContext)
  const {
    navigation,
    route: {
      params: {
        canSelect = false,
        isSameUser = true,
        title = i18n.t('Documents'),
        searchText: _searchText = '',
        itemType = 'transaction',
        itemId,
        extraQuery = {}
      } },
  } = props;

  const [searchText, setSearchText] = useState(_searchText);
  const baseURL = utils.getObject(url, 'spendi.Attachment')
  const [startURL, setStartURL] = useState(baseURL);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useRecoilState(selectedAttachmentsState);
  const [selectedIds, setSelectedIds] = useState([]);
  const isSelectedAdded = selectedIds.includes(selectedItem?.id);
  const [progress, setProgress] = useState(0);
  const [modal, setModal] = useState({ visible: false });
  const [fileUploadVisible, setFileUploadVisible] = useState(false);

  useEffect(() => {
    setSearchText(_searchText);
  }, [_searchText]);

  useEffect(() => {
    canSelect && setSelectedIds(selectedAttachments.map(s => s.id));
  }, [selectedAttachments]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', onFocusScreen);
    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);

  function onFocusScreen() {
    // update the start url everytime user focuses the screen
    setStartURL(utils.stringify({
      ...extraQuery,
      search: searchText,
      request_id: new Date().getTime(),
    }, { baseURL }));
  }

  useEffect(() => {
    setStartURL(utils.stringify({ ...extraQuery, search: searchText }, { baseURL }));
  }, [extraQuery, searchText]);

  useEffect(() => {
    if (selectedItem) {
      setModal(
        { visible: true }
      );
    } else {
      setModal(
        { visible: false }
      );
    }
  }, [selectedItem]);

  useEffect(() => {
    navigation.setOptions({
      title: selectedItem?.name || title,
    });
  }, [selectedItem]);
  const numColumns = 3;
  function removeFromSelected(item) {
    setSelectedAttachments(selectedAttachments.filter(s => s.id !== item?.id));
    selectedItem && setSelectedItem(null);
  }

  function onSubmit() {
    navigation.goBack();
  }

  function addSelectedItem(item: any) {
    item && setSelectedAttachments([...selectedAttachments, item]);
    modal.visible && setTimeout(closeModal, 10);
  }

  function closeModal() {
    setSelectedItem(null);
    setModal({ visible: false });
  }

  function addAttachment() {
    setFileUploadVisible(true)
  }

  function pickAttachment(requestType) {
    setFileUploadVisible(false);
    navigation.navigate('Attachments/Add', { itemType, itemId, requestType });
  }


  function toggleItemSelection(item) {
    isSelectedAdded ? removeFromSelected(item) : addSelectedItem(item);
  }

  async function openFile(attachment) {
    const { file: fileURI, thumbnail } = attachment;
    const session = 'cacheFiles';
    if (progress) { return; }
    setProgress(0.001);
    // const path = `RNFetchBlob-file://${fileURI.split('/').slice(-1)[0]}`;
    RNFetchBlob
      .config({
        fileCache: true,
        session,
        // `RNFetchBlob-file://path-to-file`
        // path,
        // by adding this option, the temp files will have a file extension
        appendExt: fileURI.split('.').slice(-1)[0],
      }).fetch('GET', fileURI, {
        //some headers ..
      })
      .progress({ count: 10 }, (received, total) => {
        setProgress(received / total);
      })
      .then((res) => {
        res.session(session);
        const path = Platform.OS === 'android' ? 'file://' + res.path() : '' + res.path();
        FileViewer.open(path);
      })
      .catch((err) => {
        // ...
      }).finally(() => setProgress(0));
    // clear caches when user quit the app
    // RNFetchBlob.session(session).dispose()
  }

  function renderItem({ item = {}, imageStyle = {}, disabled = false, checkBoxSize = 14 } = {}) {
    const isSelected = canSelect && selectedIds.includes(item.id);
    const { thumbnail } = item;
    return (<TouchableOpacity
      disabled={disabled}
      onPress={() => setSelectedItem(item)}
      style={style.itemContainer}
    >
      {item.is_verified && <View style={style.verificationContainer}>
        <Icon name="check" type="entypo" size={12} color={colors.primary} />
      </View>}
      <TouchableOpacity
        // enable downloading only if there is no another download
        disabled={!disabled && progress === 0}
        onPress={() => openFile(item)}
      >
        <Image
          source={thumbnail && { uri: thumbnail }}
          style={[{ width: width / numColumns, height: width / numColumns }, imageStyle]}
          resizeMode={'contain'}
        />
      </TouchableOpacity>

      {!!progress && modal?.visible && <View style={style.downloadContainer}>
        <View style={style.downloadProgress}>
          <Slider
            value={progress * 100}
            maximumValue={100}
            minimumValue={0}
            step={1}
            thumbStyle={style.downloadThumb}
          />
        </View>
        <Text style={style.downloadProgressText}>{utils.formatNumber(progress * 100, 2)}%</Text>
      </View>}
      <Text style={style.categoryNameList} numberOfLines={1}>{item.attachment_category?.name}</Text>
      <Text numberOfLines={1}>{item.name}</Text>
      {canSelect && <View style={style.checkBoxItemList}>
        <TouchableOpacity onPress={() => toggleItemSelection(item)}>
          <Icon name={`checksquare${isSelected ? '' : 'o'}`} type="antdesign" size={checkBoxSize}
            color={isSelected ? colors.primary : colors.black}
          />
        </TouchableOpacity>
      </View>}
    </TouchableOpacity>);
  }


  return (
    <View style={style.root}>
      <SearchBar
        platform={Platform.OS}
        placeholder={i18n.t('Search')}
        onChangeText={text => setSearchText(text)}
        value={searchText}
        //TODO: find a way to add them to the them
        searchIcon={{ name: 'search', type: 'evilicon' }}
        clearIcon={{ name: 'close', type: 'evilicon' }}
        cancelIcon={{ name: 'undo', type: 'evilicon', size: 30 }}
      />
      <FlatListCustom
        numColumns={numColumns}
        startURL={startURL}
        clearOnRefresh={true}
        contentContainerStyle={style.listContainer}
        renderItem={renderItem}
        ListEmptyComponent={() => <View style={style.emptyList}>
          <Icon name="unknowfile1" type="antdesign" size={60} color={colors.primary} />
          <Text style={style.emptyListText}>{
            !searchText ?
              (!isSameUser ?
                i18n.t('attachments_list_user_not_shared') :
                i18n.t('attachments_list_user_has_no_attachments')) :
              i18n.t('No documents match  your query')
          }</Text>
        </View>}
      />

      <Modal
        visible={modal?.visible || false}
        title={modal?.title}
        openType={'top'}
        modalHeight={0.8 * height}
        extraProps={{ onClosed: closeModal }}
      >
        <View>
          {!!selectedItem && renderItem({
            item: selectedItem, disabled: true,
            checkBoxSize: 20,
            imageStyle: style.selectedItemImage,
          })}
          <ListItem>
            <Icon name="calendar" type="entypo" color={colors.grey} />
            <ListItem.Content>
              <ListItem.Title>{i18n.t('Uploaded Time')}</ListItem.Title>
              <ListItem.Subtitle>{utils.formatDate(selectedItem?.created_at)} {i18n.t('by')} {selectedItem?.user?.display_name}</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>
      </Modal>

      <Modal
        visible={fileUploadVisible}
        title={i18n.t('Upload File')}
        openType={'top'}
        modalHeight={0.22 * height}
        extraProps={{
          onClosed: () => setFileUploadVisible(false)
        }}
      >
        <View style={style.uploadActions}>
          <TouchableOpacity onPress={() => pickAttachment('camera')}>
            <Icon name='camera' type='feather' color={colors.primary} />
            <Text style={style.uploadActionText}>{i18n.t('Camera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickAttachment('browse')}>
            <Icon name='file' type='feather' color={colors.primary} />
            <Text style={style.uploadActionText}>{i18n.t('Upload')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {selectedIds.length > 0 && canSelect && <View style={style.bottomMenu}>
        <TouchableOpacity style={style.shareButton}
          onPress={onSubmit}
        >
          <Icon name="share" type="entypo" size={22} color={colors.white} />
          <Text style={style.bottomMenuText}>{i18n.t('Share')}</Text>
        </TouchableOpacity>
      </View>}
      {isSameUser && <TouchableOpacity style={style.fixedButton}
        onPress={addAttachment}
      >
        <View style={style.fixedButtonIcon}>
          <Icon name="plus" type="entypo" color={colors.white} size={30} />
        </View>
      </TouchableOpacity>}
    </View>
  );
}


const style = StyleSheet.create({
  root: {
    backgroundColor: colors.white,
    flex: 1,
    paddingBottom: 0.1 * height,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  flex1: { flex: 1 },
  itemContainer: {
    flex: 1,
    alignSelf: 'center',
    marginHorizontal: 5,
  },
  selectedItemImage: {
    width: width - 10,
    height: width - 10,
    paddingHorizontal: 5,
    alignSelf: 'center',
  },
  textCenter: { textAlign: 'center' },
  bottomMenuText: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 16,
    fontWeight: '500'
  },
  mr10: {
    marginRight: 10,
  },
  bottomMenu: {
    position: 'absolute',
    bottom: Platform.select({
      ios: 60,
      default: 40,
    }),
    backgroundColor: colors.primary,
    height: 60,
    width: 0.6 * width,
    borderRadius: 22.5,
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  fixedButton: {
    position: 'absolute',
    bottom: Platform.select({
      ios: 68,
      default: 48,
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
  selectedItem: {
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
    margin: 4,
    borderRadius: 20,
    paddingBottom: 80,
  },
  emptyList: {
    padding: 10,
    paddingTop: 0.2 * height,
    flex: 1,
  },
  emptyListText: {
    lineHeight: 30,
    textAlign: 'center',
    paddingVertical: 50,
  },
  categoryNameList: { fontSize: 12, color: colors.grey },
  checkBoxItemList: { position: 'relative', top: -40, right: 0, zIndex: 10, alignSelf: 'flex-end' },
  verificationContainer: { position: 'relative', top: 20, right: 5, zIndex: 10, alignSelf: 'flex-end' },
  downloadContainer: { flexDirection: 'row', flex: 1 },
  downloadProgress: { minWidth: 0.6 * width, marginTop: -10, marginHorizontal: 10 },
  downloadThumb: { height: 5, width: 5, backgroundColor: 'blue' },
  downloadProgressText: { fontSize: 10 },
  //fixed button
  uploadActions: {
    paddingTop: 30, flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0.2 * width,
  },
  uploadActionText: {
    fontStyle: 'italic',
    paddingTop: 10
  }

});
