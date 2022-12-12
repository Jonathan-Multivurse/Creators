import React from 'react'
import { StyleSheet, Text, Dimensions } from 'react-native'
// import { Text } from 'react-native-paper'
import { theme } from '../core/theme'

const DEVICE_WIDTH = Dimensions.get('window').width
export default function PageTitle(props) {
  return <Text style={styles.header} {...props} />
}

const styles = StyleSheet.create({
  header: {
    height: 28,
    maxWidth: DEVICE_WIDTH - 80,
    position: 'absolute',
    bottom: 0,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500'    
  },
})