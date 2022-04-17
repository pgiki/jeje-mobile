import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export default function Loading(props) {
  const { items = [1, 2, 3, 4] } = props;
  return (<View style={props.containerStyle}>
    <SkeletonPlaceholder>
      {items.map(i => (
        <View style={style.loading} key={i} >
          <SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
            <SkeletonPlaceholder.Item width={60} height={60} borderRadius={50} />
            <SkeletonPlaceholder.Item marginLeft={20}>
              <SkeletonPlaceholder.Item width={120} height={20} borderRadius={4} />
              <SkeletonPlaceholder.Item
                marginTop={6}
                width={80}
                height={20}
                borderRadius={4}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>
        </View>
      ))}
    </SkeletonPlaceholder>
  </View>);
}

const style = StyleSheet.create({
  loading: {
    marginTop: 20,
  },
});
