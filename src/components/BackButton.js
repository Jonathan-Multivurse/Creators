import React from 'react'
import { TouchableOpacity, Image, StyleSheet } from 'react-native'

export default function BackButton({ goBack }) {
  return (
    <TouchableOpacity onPress={goBack} style={styles.container}>
      <Image
        style={styles.image}
        source={require('../assets/images/login/arrow_back.png')}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 50,
    height: 50,
    bottom: 0,
    left: 0,
    paddingBottom: 9,
    paddingLeft: 16,
    justifyContent: 'flex-end',
  },
  
  image: {
    width: 12,
    height: 20.5,
  },
})