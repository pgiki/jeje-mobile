/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { useModalize } from 'react-native-modalize/lib/utils/use-modalize';
import { Text } from '@rneui/themed';
import { height } from 'src/helpers';

export default function Modal(props) {
  const {
    title,
    subtitle,
    snapPoint = 0.2 * height,
    extraProps = {},
    modalHeight = 0.75 * height,
    openType = 'top',
  } = props;
  const { ref, open, close } = useModalize();
  const [visible, setVisible] = useState(props.visible);

  function onOpen() {
    open(openType);
  }

  function onClose() {
    close();
  }

  useEffect(() => {
    if (visible !== props.visible) {
      setVisible(props.visible);
    }
    if (!props.visible) {
      onClose();
    } else {
      onOpen();
    }
  }, [props.visible]);

  return (
    <Modalize
      // withHandle
      // onLayout={handleLayout}
      ref={ref}
      // adjustToContentHeight
      handlePosition={'inside'}
      avoidKeyboardLikeIOS={Platform.select({ ios: true, android: false })}
      modalStyle={[s.content__modal, props.containerStyle || {}]}
      snapPoint={snapPoint}
      modalHeight={modalHeight}
      threshold={height * 0.5}
      velocity={4000}
      flatListProps={{
        data: [props.children],
        renderItem: ({ item, index }) => item,
        keyExtractor: (item, index) => index,
        showsVerticalScrollIndicator: false,
        ListHeaderComponent: ((!!title || !!subtitle) ? <View style={s.content}>
          {!!title && <Text style={s.content__subheading}>{title}</Text>}
          {!!subtitle && <Text style={s.content__heading}>{subtitle}</Text>}
        </View> : null),
      }}
      // alwaysOpen={alwaysOpen}
      // tapGestureEnabled={true}
      // panGestureEnabled={true}
      // enablePanGestrureHandle={true}
      // panGestureEnabled={false}
      // tapGestureEnabled={false}
      // handlePosition="inside"
      {...extraProps}
    />
  );

}

const s = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  content__modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    flex: 1,
    // padding: 10,
    // maxWidth:width,
  },
  content__subheading: {
    marginBottom: 2,
    fontSize: 18,
    textAlign: 'center',
    // paddingLeft: 10,
    fontWeight: '600',
    color: '#ccc',
    flex: 1,
  },

  content__heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    flex: 1,
  },
});
