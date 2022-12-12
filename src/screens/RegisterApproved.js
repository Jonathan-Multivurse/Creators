import React, { Component } from 'react'
import { StyleSheet, View, TouchableOpacity, Platform, Text, Linking, Dimensions, Image } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'

const DEVICE_WIDTH = Dimensions.get('window').width;

export default class RegisterApproved extends Component {
  constructor(props) {
    super(props);   
  }

  onContinuePressed = () => {
    this.props.navigation.navigate('LoginScreen')
  }

  openTerms = async () => {
    // this.props.navigation.replace('TermsScreen')

    const termsURL = 'https://www.echo.healthcare/support'
    Linking.canOpenURL(termsURL).then(supported => {
      if (supported) {
        Linking.openURL(termsURL);
      } else {
        console.log("Don't know how to open URI: " + termsURL);
      }
    });
  }

  render() {
    return (
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Account Approved</PageTitle>
        </View>

        <View style = {styles.contentView}>
          <View style={{flex: 1}} />
          <Image source={require('../assets/images/login/approve.png')} style={styles.image} />
          <View style={{flex: 1}} />
          <Text style={styles.yourText}>Your company representative account is approved. Please continue.</Text>
          <View style={{flex: 1}}></View>

          <TouchableOpacity style={styles.loginButton} onPress={() => this.onContinuePressed()}>
            <Text style={styles.loginText}>Continue</Text>
          </TouchableOpacity>

          <View style={styles.termsView}>
            <Text style={styles.byText}>By continuing you agree to </Text>
            <TouchableOpacity onPress={() => this.openTerms()}>
              <Text style={styles.termsText}>Terms and Conditions.</Text>
            </TouchableOpacity>
          </View>

        </View>

      </Background>
    )
  }
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
    marginTop: 15,
    marginBottom: 32,
    borderRadius: 28.5,
    backgroundColor: theme.colors.darkBlue,
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

  termsView: {
    height: 41,
    marginBottom: 69,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  byText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  }, 

  termsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
    textDecorationLine: 'underline',
  },   
})