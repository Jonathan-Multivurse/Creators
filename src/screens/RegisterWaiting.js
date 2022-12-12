import React, { useState, useEffect } from 'react'
import { TouchableOpacity, Platform, StyleSheet, View, Dimensions, Image, Text} from 'react-native'
import Background from '../components/Background'
import PageTitle from '../components/PageTitle'
import BackButton from '../components/BackButton'
import { theme } from '../core/theme'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import USER_DB from '../api/userDB'

import auth, {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'

const DEVICE_WIDTH = Dimensions.get('window').width;

export default function RegisterWaiting({ navigation }) {
  const [seconds, setSeconds] = React.useState(3600);
  const [enabled, setEnabled] = React.useState(true);

  useEffect(() => {
    const userID = firebase.auth().currentUser.uid;

    const unsubscribe = 
    firestore()
    .collection('users')
    .doc(userID)
    .onSnapshot({
      error: (e) => console.error(e),
      next: (documentSnapshot) => {
        if ((documentSnapshot.data()['isAccept'] === 'accepted' )) {
          goNextPage()          
        }
      }
    })      
  }, []);

  const goNextPage = async () => {    
    navigation.navigate('RegisterApproved');
  };

  const onNotify = () => {       
       if (enabled) {
        USER_DB.updateProfile({updated: new Date().getTime()}, goNext);        
       } else {
       }    
  }

  const goNext = async () => {    
      setSeconds(3600);
      setEnabled(false);
  };

  React.useEffect(() => {
    if (seconds > 0) {
      setTimeout(() => setSeconds(seconds - 1), 1000);
    } else {
      setEnabled(true);
    }
  });

  return (
    <Background>
      <View style = {styles.navigationView}>
        <BackButton goBack={navigation.goBack} />
        <PageTitle>Admin is Notified</PageTitle>
      </View>

      <View style={styles.contentView}>
        <View style={{flex: 1}} />
        <Image source={require('../assets/images/login/waiting.png')} style={styles.imageView} />
        <View style={{flex: 1}} />
        <Text style={styles.yourText}>Your company representative account creation request is sent to your admin. Please wait till it gets accepted.</Text>
        <View style={{flex: 1}} />
        <TouchableOpacity style={{...styles.loginButton, backgroundColor: enabled? theme.colors.darkBlue : theme.colors.lightGray }} onPress={onNotify} >
            <Text style={styles.loginText}>Notify Manager Again</Text>
        </TouchableOpacity>
        <Text style={styles.youText}>You can notify your manager again after an hour.</Text>

      </View>

    </Background>
  )
}

const styles = StyleSheet.create({
  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  contentView: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  imageView: {
    width: DEVICE_WIDTH - 80,
    height: (DEVICE_WIDTH - 80) * 328/375,
    
  },

  yourText: {
    width: 320,
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 25,
    fontFamily: 'Poppins-Regular',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 33,
    borderRadius: 28.5,
    // backgroundColor: theme.colors.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  loginText: {
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: 'white',
  },

  youText: {
    width: 261,
    marginTop: 33,
    marginBottom: 69,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  },

})