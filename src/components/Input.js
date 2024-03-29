import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, Keyboard } from 'react-native';
import { Text, Icon, Overlay, ListItem, SearchBar } from '@rneui/themed';
import { TextInput } from 'react-native-paper';
import { colors, utils, font, DEBUG, requests, height, width } from 'src/helpers';
import FastImage from 'react-native-fast-image';
import TextInputMask from 'react-native-text-input-mask';
import { phoneMasks, countries, currencies } from 'src/helpers/constants';
import { FlatList } from 'react-native-gesture-handler';
import * as flags from 'src/assets/flags'
import { Button, ScrollView } from './index';
import _ from 'lodash'
import { LocalizationContext } from 'src/helpers';

export function DropdownInput(props) {
  const {
    url,
    resultsField = 'results',
    value,
    placeholder,
    labelField = "name",
    valueField = "id",
    getLabel = (_item) => utils.getObject(_item, labelField),
    onChangeText = (v) => null,
    many = false,
    canCreate = true,
  } = props;

  const { i18n } = useContext(LocalizationContext)
  const [data, setData] = useState(props.data || [])
  const [isFocus, setIsFocus] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState(value ? (Array.isArray(value) ? value : [value]) : [])
  const loggedUser = utils.getUser();

  useEffect(() => {
    if (url) {
      debounceFetchData(utils.stringify({ search: searchText }, { baseURL: url }));
      return debounceFetchData.cancel
    }
  }, [url, searchText])

  useEffect(() => {
    if (props.value && !_.isEqual(props.value, selectedItems)) {
      setSelectedItems(Array.isArray(props.value) ? props.value : [props.value]);
    }
  }, [props.value])

  useEffect(() => {
    props.data && !_.isEqual(props.data, data) && setData(props.data || [])
  }, [props.data])

  useEffect(() => {
    if (many) {
      onChangeText(selectedItems)
    } else {
      onChangeText(selectedItems[0])
    }
  }, [selectedItems])

  useEffect(() => {
    // clear search text when hiding the modal
    if (!isModalVisible) {
      setSearchText('')
    }
  }, [isModalVisible])

  const debounceFetchData = useCallback(
    _.debounce((link) => fetchData(link),
      800), []);

  async function fetchData(link) {
    const res = await requests.get(link || utils.stringify({ search: searchText }, { baseURL: url }))
    const results = res[resultsField]
    setData(results)
  }
  async function onCreate() {
    setLoading(true)
    const res = await requests.post(url, {
      [labelField]: searchText,
      user: loggedUser.id,
    })
    await fetchData();
    onChange(res);
    setLoading(false);
    setIsModalVisible(false);
  }

  const onChange = selectedItem => {
    if (many) {
      const isChecked = selectedItems.map(item => item.id).includes(selectedItem.id)
      if (isChecked) {
        setSelectedItems(selectedItems.filter(item => item.id !== selectedItem.id))
      } else {
        setSelectedItems([...selectedItems, selectedItem])
      }
    } else {
      setSelectedItems([selectedItem])
    }
    setIsFocus(false);
  }

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible)
  }

  function onFocus() {
    if (!isModalVisible && isModalVisible !== true) {
      setIsModalVisible(true);
      setIsFocus(true);
    }
    Keyboard.dismiss()
  }
  function onBlur() {
    if (!isModalVisible && isModalVisible !== false) {
      setIsModalVisible(false);
      setIsFocus(false);
    }
  }

  return <View>
    {many && selectedItems.length > 0 ?
      <View>
        <TouchableOpacity
          onPress={onFocus}
          style={style.editSelectedItems}>
          <Text>{props.label || props.placeholder}</Text>
          <Icon name='edit' type='antdesign' />
        </TouchableOpacity>
        <ScrollView
          horizontal={true}
          contentContainerStyle={style.selectedItemsContainer1}
        >
          {selectedItems.map((item, index) => <TouchableOpacity
            key={index}
            onPress={() => onChange(item)}
            style={style.selectedItemsItem}
          >
            <Text style={{ fontSize: 12, color: colors.grey, paddingVertical: 4 }}>{getLabel(item)} <Icon name='close' type='antdesign' size={10} color={colors.grey} /></Text>
          </TouchableOpacity>)}
        </ScrollView>
      </View>
      : <TextInput
        {...props}
        keyboardType={undefined}
        value={selectedItems.map(getLabel).join(", ")}
        style={style.inputStyle}
        onFocus={onFocus}
        onBlur={onBlur}
      />}
    <Overlay
      isVisible={isModalVisible}
      overlayStyle={style.dropdownOverlay}
      onBackdropPress={toggleModal}
    >
      <View>
        <TouchableOpacity
          style={style.overlayCloseButton}
          onPress={() => setIsModalVisible(false)}>
          <Icon name='close-o' type='evilicon' size={35} color={colors.grey} />
        </TouchableOpacity>
        <SearchBar
          platform={'android'}
          placeholder={placeholder || i18n.t('Search')}
          onChangeText={text => setSearchText(text)}
          value={searchText}
          containerStyle={style.countrySearch}
          //TODO: find a way to add them to the them
          searchIcon={{ name: 'search', type: 'evilicon' }}
          clearIcon={{ name: 'close', type: 'evilicon' }}
          cancelIcon={{ name: 'undo', type: 'evilicon', size: 30 }}
        />
      </View>
      {selectedItems.length > 0 &&
        <ScrollView horizontal={true}
          contentContainerStyle={style.selectedItemsContainer}
        >
          {selectedItems.map((item, index) => <TouchableOpacity
            key={index}
            onPress={() => onChange(item)}
            style={style.selectedItemsItem}
          >
            <Text>{getLabel(item)} <Icon name='close' type='antdesign' size={12} color={colors.grey} /></Text>
          </TouchableOpacity>)}
        </ScrollView>}
      <FlatList
        data={data}
        keyExtractor={utils.keyExtractor}
        ListEmptyComponent={!searchText ? <View style={style.emptyOverlayList}>
          <Text>
            {i18n.t('Click and start typing on search bar to create items which do not exist yet')}
          </Text>
        </View> : undefined}
        renderItem={({ item, index }) => {
          const isChecked = selectedItems.map(item => item.id).includes(item.id)
          return (<ListItem
            onPress={() => {
              onChange(item);
              !many && setIsModalVisible(false);
            }}
            bottomDivider
          >
            <ListItem.Content>
              <ListItem.Title style={{ color: isChecked ? colors.primary : colors.black }}>
                {getLabel(item)}
              </ListItem.Title>
              {/* <ListItem.Subtitle>{item.cc}</ListItem.Subtitle> */}
            </ListItem.Content>
            {isChecked && <Icon name="check" type='antdesign' color={colors.primary} />}
          </ListItem>)
        }}

        ListFooterComponent={(!!searchText && canCreate) ? <Button
          title={i18n.t('Create {searchText}', { searchText })}
          loading={loading}
          style={style.mt40}
          onPress={onCreate}
          type='solid'
          textColor={colors.white}
        /> : undefined}
      />
    </Overlay>
  </View>

}


// export const DropdownInput =  React.memo(DropdownInput_, _.isEqual);

export function CurrencyOptionsInput(props) {
  const { onChangeText, label, containerStyle } = props;
  const [value, setValue] = useState(props.value);
  const [country, setCountry] = useState()
  const [errorMessage, setErrorMessage] = useState(props.errorMessage);
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    setErrorMessage(props.errorMessage);
  }, [props.errorMessage]);

  useEffect(() => {
    setCountry(currencies.filter(c => c.cc === value)[0]);
    onChangeText(value);
  }, [value])

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const toggleModal = () => setIsModalVisible(!isModalVisible)

  return (
    <View style={[style.currencyInputContainer, containerStyle]}>
      <ListItem onPress={toggleModal}>
        <Text>{country?.symbol}</Text>
        <ListItem.Content>
          {!!label && <ListItem.Title>{label}</ListItem.Title>}
          <ListItem.Subtitle>{value || props.placeholder}</ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
      {!!errorMessage && <Text style={style.errorMessage}>{errorMessage}</Text>}
      <Overlay
        isVisible={isModalVisible}
        fullScreen
        onBackdropPress={toggleModal}
      // overlayStyle={{marginTop:40}}
      >
        <View>
          <SearchBar
            platform={Platform.OS}
            placeholder={props.placeholder || 'Search...'}
            onChangeText={text => setSearchText(text)}
            value={searchText}
            containerStyle={style.countrySearch}
            //TODO: find a way to add them to the them
            searchIcon={{ name: 'search', type: 'evilicon' }}
            clearIcon={{ name: 'close', type: 'evilicon' }}
            cancelIcon={{ name: 'undo', type: 'evilicon', size: 30 }}
          />
        </View>
        <FlatList
          data={currencies.filter(c => !searchText ? true : c.name.toLowerCase().includes(searchText.toLowerCase()))}
          keyExtractor={utils.keyExtractor}
          renderItem={({ item, index }) => <ListItem
            onPress={() => {
              setValue(item.cc);
              setSearchText(item.name)
              toggleModal()
            }}
            bottomDivider
          >
            <Text>{item.symbol}</Text>
            <ListItem.Content>
              <ListItem.Title>{item.name}</ListItem.Title>
              <ListItem.Subtitle>{item.cc}</ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>}
        />
      </Overlay>
    </View>
  );
}

export function PhoneInput(props) {
  const { onChange } = props;
  const [formattedValue, setFormattedValue] = useState('');
  const [countryCode, setCountryCode] = useState(props.countryCode || 'TZ');
  const [mask, setMask] = useState(phoneMasks[countryCode])
  const [errorMessage, setErrorMessage] = useState(props.errorMessage);
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isFocused, setIsFocused] = useState(false);

  const ref = useRef()

  function renderOverlay() {
    return <Overlay
      isVisible={isModalVisible}
      fullScreen
      onBackdropPress={toggleModal}
    // overlayStyle={{marginTop:40}}
    >
      <View>
        <SearchBar
          platform={Platform.OS}
          placeholder={'Search...'}
          onChangeText={text => setSearchText(text)}
          value={searchText}
          containerStyle={style.countrySearch}
          //TODO: find a way to add them to the them
          searchIcon={{ name: 'search', type: 'evilicon' }}
          clearIcon={{ name: 'close', type: 'evilicon' }}
          cancelIcon={{ name: 'undo', type: 'evilicon', size: 30 }}
        />
      </View>
      <FlatList
        data={countries.filter(c => !searchText ? true : c.name.toLowerCase().includes(searchText.toLowerCase()))}
        keyExtractor={utils.keyExtractor}
        renderItem={({ item, index }) => <ListItem
          onPress={() => {
            setCountryCode(item.code);
            setSearchText(item.name)
            toggleModal()
          }}
          bottomDivider
        >
          <FastImage source={flags[item.code]} style={style.flagImage} />
          <ListItem.Content>
            <ListItem.Title>{item.name}</ListItem.Title>
            <ListItem.Subtitle>{item.code}</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>}
      />
    </Overlay>
  }

  useEffect(() => {
    setErrorMessage(props.errorMessage);
  }, [props.errorMessage]);

  useEffect(() => {
    setMask(phoneMasks[countryCode])
  }, [countryCode])

  useEffect(() => {
    setFormattedValue('')
  }, [mask])

  const toggleModal = () => setIsModalVisible(!isModalVisible)

  return (
    <>
      <TextInput
        left={<TextInput.Icon name={({ size, color }) => (
          <TouchableOpacity onPress={toggleModal} style={[style.flagContainer, !isFocused && style.greyBorder]}>
            <FastImage source={flags[countryCode]} style={style.flagImage} resizeMode={'contain'} />
          </TouchableOpacity>
        )} >
        </TextInput.Icon>}
        {...props}
        style={[style.inputStyle, props.style]}
        render={_props =>
          <TextInputMask
            keyboardType="phone-pad"
            {..._props}
            label={undefined}
            value={formattedValue}
            onChangeText={(_formattedValue, extracted) => {
              const value = `+${utils.extractDigits(_formattedValue)}`;
              onChange && onChange({
                value,
                formattedValue: _formattedValue,
                valid: value.length === 13,
              });
              setFormattedValue(value);
              if (extracted && extracted[0] === '0') {
                setErrorMessage('Cannot start phone number with "0"');
              }
              else if (extracted && extracted?.length < mask?.count("0")) {
                setErrorMessage('Enter a valid phone number');
              }
              else {
                setErrorMessage('');
              }
              // console.log(formattedValue) // +1 (123) 456-78-90
              // console.log(extracted) // 1234567890
            }}
            mask={mask}
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        }
      />
      {!!errorMessage && <Text style={style.errorMessage}>{errorMessage}</Text>}
      {renderOverlay()}
    </>
  );
}


export function ImageInput(props) {
  const loggedUser = utils.getUser();
  const {
    action: link,
    onImageUpload,
    label,
    placeholder,
    onChangeText: onChange,
    value,
    errorMessage,
    fileFields = ['avatar'],
  } = props;
  const [imageSelectVisible, setImageSelectVisible] = useState(false);
  const [image, setImage] = useState(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof value === 'string') {
      setImage({ uri: value });
    }
  }, [value]);

  const uploadImage = async _image => {
    /*
      TODO: limit the number of image search unregistered users can do
    */
    setImage(_image);
    onChange && onChange(_image);
    if (link) {
      //upload if link is provided
      setLoading(true);
      const data = utils.createFormData({
        body: { [fileFields[0]]: _image },
        fileFields,
      });
      const headers = {
        'Content-Type': 'multipart/form-data;',
        //'Content-Disposition': 'attachment;',
        Authorization: `Token ${loggedUser?.token}`,
      };
      try {
        let res = await requests.post(link, data, {
          headers: headers,
          onUploadProgress: progress => {
            DEBUG && console.log('progress', progress);
          },
        });
        if (res.id) {
          // set the uploaded image
          setImage(res);
        }
        onImageUpload && onImageUpload(res);
        // update the search now
      } catch (e) {
        setLoading(false);
        setError(e.message);
      }
    }
  };

  const uploadimage = useCallback(({ type = 'library' } = {}) => {
    setImage(null);
    // setUploadType(type);
    if (type === 'capture') {
      launchCamera(
        {
          selectionLimit: 1,
          mediaType: 'image',
        },
        res => {
          if (!res.didCancel) {
            const file = res.assets[0];
            uploadImage(file);
          }
        },
      );
    } else {
      launchImageLibrary(
        {
          title: 'Select Picture',
          storageOptions: {
            skipBackup: true,
            path: 'images',
          },
          maxWidth: 500,
          maxHeight: 500,
          quality: 0.5,
        },
        res => {
          if (!res.didCancel) {
            const file = res.assets[0];
            uploadImage(file);
          }
        },
      );
    }
  }, []);

  const onImage = async () => {
    setImageSelectVisible(!imageSelectVisible);
  };

  const onImageModalOpen = () => {
    setImageSelectVisible(true);
  };
  const onImageModalClose = () => {
    setImageSelectVisible(false);
  };

  return (
    <>
      <ListItem onPress={() => uploadimage({ type: 'library' })}>
        <FastImage source={image} style={style.image} />
        <View>
          <ListItem.Title style={style.label}>{label}</ListItem.Title>
          <ListItem.Subtitle style={style.pt10}>
            {!image ? placeholder : 'Click to upload new'}
          </ListItem.Subtitle>
          <Text style={style.errorMessage}>{errorMessage}</Text>
        </View>
      </ListItem>
    </>
  );
}


export default function CustomInput(props) {
  const {
    keyboardType = 'default',
    label,
    placeholder,
    value,
    errorMessage,
    onChangeText: onChange,
  } = props;
  // useEffect(() => {
  //   onChange && value && onChange(value);
  // }, []);

  switch (keyboardType) {
    case 'image':
      return <ImageInput {...props} />;
    case 'dropdown':
      return <DropdownInput {...props} />;
    case 'phone-pad':
      return <PhoneInput {...props} />;
    case 'currency-options':
      return <CurrencyOptionsInput {...props} />;
    default:
      return (
        <TextInput
          error={!!errorMessage}
          style={style.inputStyle}
          type={'flat'}
          dense={true}
          underlineColor='transparent'
          {...props}
        />
      )
  }
}

const style = StyleSheet.create({
  flex1: { flex: 1 },
  inputStyle: {
    flex: 1,
    marginVertical: 10,
    marginHorizontal: 5,
    color: colors.black,
    backgroundColor: colors.primary2,
    // saspaddingVertical: 5,
    // textAlign:'center'
  },
  currencyInputContainer: {
    flex: 1,
    // width: width,
    paddingTop: 10,
  },
  mh12: { marginHorizontal: 12 },
  greyText: { color: colors.grey4 },
  label: {
    color: colors.placeholder,
    fontWeight: 'bold',
    fontSize: 18,
    paddingBottom: 6,
  },
  image: { width: 60, height: 60 },
  errorMessage: {
    color: 'red',
    paddingLeft: 10,
    paddingBottom: 10,
    fontSize: 12,
  },
  flagContainer: {
    flexDirection: 'row',
    padding: 1,
  },
  greyBorder: {
    borderColor: colors.grey,
  },
  flagImage: {
    width: 30,
    height: 30,
  },
  phoneContainer: {
    marginLeft: 4,
  },
  pt10: { paddingTop: 10 },
  horizontal: {
    flexDirection: 'row', flex: 1,
  },
  countrySearch: {
    paddingTop: Platform.select({
      ios: 70,
      default: 20,
    })
  },
  //customize dropdown
  dropdown: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  buttonLabelText: {
    color: colors.white,
  },
  dropdownOverlay: {
    width,
    height: 0.8 * height,
    marginTop: 150,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20
  },
  editSelectedItems: {
    flexDirection: 'row',
    flex: 1,
    paddingBottom: 10,
    paddingLeft: 6,
    // justifyContent: 'space-between',
  },
  selectedItemsContainer1: {
    marginBottom: 15,
    marginHorizontal: 6,
  },
  selectedItemsContainer: {
    marginBottom: 10,
    height: 30
  },
  selectedItemsItem: {
    borderColor: colors.grey,
    marginRight: 5,
    paddingTop: 3,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  overlayCloseButton: { position: 'absolute', top: -5, right: 0, zIndex: 99 },
  mt40: { marginTop: 40 },
  emptyOverlayList: { flex: 1, marginVertical: 50, paddingHorizontal: 10 },
});
