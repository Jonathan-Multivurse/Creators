import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../core/theme'
import {hrsToStart} from '../services/hrsToPx';

const ApptView = ({topTime, appt, hour_size, onEventPress}) => {
  const margin = hrsToStart(appt.start, topTime) * hour_size;
  const height = hrsToStart(appt.start, appt.end) * hour_size;

  return <View
    style={{
      flex:1,
      width: '100%',
      height: height,
      marginLeft: 1,
      marginTop: margin,
      backgroundColor: (appt.title === 'Video') ? '#00ACEC' : (appt.title === 'Call') ? '#2BCC71' : (appt.title === 'Chat') ? '#EF8F35' : theme.colors.lightGray ,
      borderRadius: 8,
      padding: 2,
      overflow: 'hidden',
    }}
  >
    <TouchableOpacity style={{margin: 0, padding: 0, flex: 1, justifyContent: 'center'}}
      onPress={() => onEventPress(appt)}>
      <Text style={{marginLeft: 16, fontSize: 13, lineHeight: 16, fontFamily: 'Poppins-Regular'}}>
        {appt.title == 'Video' || appt.title == 'Call' || appt.title == 'Chat' ? '' :  appt.title}
      </Text>
    </TouchableOpacity>
  </View>
}

export default ApptView;