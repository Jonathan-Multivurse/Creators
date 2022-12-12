import React from 'react'
import { StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, View } from 'react-native'

export default function Background({ children }) {
  return (
    Platform.OS === 'ios'? 
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {children}      
    </KeyboardAvoidingView>
    :<SafeAreaView style={styles.container} behavior="padding">
      {children}      
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'white'
  },
})
