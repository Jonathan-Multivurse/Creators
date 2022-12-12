import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const TimeArr = (startHour, endHour) => {
  const tmpArray = []
  for (let i = startHour; i <= endHour; i++) {
    tmpArray.push(getAvailableTime(i))
  }

  return tmpArray
} 

const TimeCol = ({hour_size, startHour, endHour}) =>
  <View style={{paddingTop: 0}}>
    {TimeArr(startHour, endHour).map((val, i) =>
      <View style={[styles.box, {height: hour_size}]} key={i}>
        <Text style={styles.textStyle}>{val}</Text>
      </View>
    )}
  </View>

let styles = StyleSheet.create({
  box: {
    justifyContent: 'flex-start',
    alignItems:'center',
  },

  textStyle:{
    height: 20,
    textAlign:'center',
    fontSize: 12,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
  }
})

export default TimeCol;