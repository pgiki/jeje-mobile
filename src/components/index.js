import React from 'react';
import {
  ScrollView as ScrollViewRN,
  TouchableOpacity as TouchableOpacityRN,
  Platform,
} from 'react-native';
import { ScrollView as ScrollViewGH, TouchableOpacity as TouchableOpacityGH } from 'react-native-gesture-handler';
import { Button as PaperButton } from 'react-native-paper';

export const TouchableOpacity = Platform.select({
  ios: TouchableOpacityRN, default: TouchableOpacityGH,
});

export const ScrollView = Platform.select({
  ios: ScrollViewRN,
  default: ScrollViewGH,
});


export function Button(props) {
  const { type = 'contained' } = props;
  const mode = {
    solid: 'contained',
    outline: 'outlined',
    clear: 'text',
  }[type] || type
  return <PaperButton
    uppercase={false}
    {...props}
    style={props.buttonStyle} mode={mode} >{props.title}</PaperButton>
}
export * from './Footer'