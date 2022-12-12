import React from 'react';
import {StyleSheet, View, TextInput} from 'react-native';
import { theme } from '../core/theme'

export default function CustomTextInput({containerStyle, style, refCallback, ...props}) {
  return (
    <View style={[styles.containerStyle, containerStyle]}>
      <TextInput
        {...props}
        style={[styles.textInputStyle, style]}
        ref={refCallback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  containerStyle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 8,
  },

  textInputStyle: {
    padding: 0,
    flex: 1,
  },
})