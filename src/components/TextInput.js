import React from 'react'
import { View, StyleSheet, Text, TextInput } from 'react-native'
// import { TextInput as Input } from 'react-native-paper'
import { theme } from '../core/theme'

export default function TextInput({ errorText, description, ...props }) {
  return (
    <View style={styles.container}>
      <Input
        style={styles.input}
        selectionColor={theme.colors.text}
        underlineColor="transparent"
        mode="outlined"
        {...props}
      />
      {description && !errorText ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },  

  input: {
    height: 50,
    backgroundColor: theme.colors.inputBack,
    borderColor: theme.colors.inputBorder,
  },

  description: {
    fontSize: 13,
    color: theme.colors.lightGray,
    paddingTop: 8,
  },
  
  error: {
    fontSize: 13,
    color: theme.colors.error,
    paddingTop: 8,
  },
})
