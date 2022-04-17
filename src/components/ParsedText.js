import React, {useEffect, useState} from "react";
import {Linking, StyleSheet, View, Clipboard, Alert} from "react-native";
import ParsedText from 'react-native-parsed-text';
import {font} from "src/helpers";
const styles = StyleSheet.create({
  url: {
    color: 'red',
    textDecorationLine: 'underline',
  },

  email: {
    textDecorationLine: 'underline',
  },

  text: {
    color: 'black',
    fontSize: 15,
    fontFamily:font.regular,
  },

  phone: {
    color: 'blue',
    textDecorationLine: 'underline',
  },

  name: {
    color: 'red',
  },

  username: {
    color: 'green',
    fontWeight: 'bold'
  },

  magicNumber: {
    fontSize: 42,
    color: 'pink',
  },

  hashTag: {
    fontStyle: 'italic',
    fontFamily:font.light,
  },

});
export const phonePattern= /[\+]?[(]?[0-9]{1,3}[)]?[-\s\._]?[0-9]{3}[-\s\._]?[0-9]{2,3}[-\s\._]?[0-9]{1,2}[-\s\._]?[0-9]{1,2}/

const handleUrlPress=(url, matchIndex /*: number*/)=> {
  Linking.openURL(url);
}

const handlePhonePress=(phone, matchIndex /*: number*/)=> {
  handleUrlPress(`tel:${phone}`);
}

const handleNamePress=(name, matchIndex /*: number*/) =>{
  //TODO: filter by user;
}

const handleEmailPress=(email, matchIndex /*: number*/) =>{
  handleUrlPress(`mailto:${email}`);
}

const renderText=(matchingString, matches)=>{
    // matches => ["[@michel:5455345]", "@michel", "5455345"]
    let pattern = /\[(@[^:]+):([^\]]+)\]/i;
    let match = matchingString.match(pattern);
    return `^^${match[1]}^^`;
}

const copyClipboard=async(text)=>{
    await Clipboard.setString(text);
    Alert.alert("Copied to clipboard", text);
}


export const parseText=(
            [
              {type: 'url',                       style: styles.url, onPress: handleUrlPress, onLongPress:copyClipboard},
              {pattern:phonePattern, style: styles.phone, onPress: handlePhonePress, onLongPress:copyClipboard},
              {type: 'email',                     style: styles.email, onPress: handleEmailPress, onLongPress:copyClipboard},
              {pattern: /\[(@[^:]+):([^\]]+)\]/i, style: styles.username, onPress: handleNamePress, renderText: renderText, onLongPress:copyClipboard},
              {pattern: /#(\w+)/,                 style: styles.hashTag},
            ]
)

export default function ParseTextComponent(props){
   // const phonePattern = /([\+]\d{1,2}\s)?\(?\d{3}\)?[\_\s.-]?\d{3}[\_\s.-]?\d{3}[\_\s.-]?\d{3}/
  // const phonePattern = /([\+]\d{1,2}\s)?\(?\d{3}\)?[\_\s.-]?\d{3}[\_\s.-]?\d{3}[\_\s.-]?\d{3}/
  return (
      <View style={props.style}>
        <ParsedText
          style={styles.text}
          parse={parseText}
          childrenProps={{allowFontScaling: false}}
        >
         {props.children}
        </ParsedText>
      </View>
    );
}