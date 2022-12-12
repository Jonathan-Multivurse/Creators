import React, { Component } from 'react'
import { StyleSheet, Platform, View, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator } from 'react-native'
import Background from '../components/Background'
import PageTitle from '../components/PageTitle'
import BackButton from '../components/BackButton'
import { theme } from '../core/theme'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import { emailValidator } from '../helpers/emailValidator'
import EMAIL_AUTH from '../api/userAuth'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class ResetPasswordScreen extends Component {
  constructor(props) {
    super(props);   

    this.state = { 
      isLoading: false,
      email: '', 
      emailError: '', 
    }
  }

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  sendResetPasswordEmail = () => {
    const emailError = emailValidator(this.state.email)

    if (emailError) {
      this.updateInputVal(emailError, 'emailError')
      return
    }

    EMAIL_AUTH.onSendPasswordReset(this.state.email, this.sentDone)
  }

  sentDone = async () => {
    this.props.navigation.goBack()
  }; 

  render() {
    return (
      <Background>

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Reset Password</PageTitle>
        </View>

        <View style = {styles.contentView}>
          <Text style={styles.emailText}>Email</Text>
          <TextInput
            style={styles.emailInput}
            value={this.state.email}
            onChangeText={ (text) => this.updateInputVal(text, 'email') }
            autoCapitalize="none"
            autoCompleteType="email"
            textContentType="emailAddress"
            keyboardType="email-address"
          />        
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.loginButton} onPress={() => this.sendResetPasswordEmail()}>
            <Text style={styles.loginText}>Submit</Text>
          </TouchableOpacity>

        </View>

        {this.state.isLoading ? 
        (<ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={styles.preloader}
          />
        ) : null}
      </Background>
    )
  }
}

const styles = StyleSheet.create({

  preloader: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },

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

  emailText: {
    height: 20,
    marginTop: 44,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  emailInput: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginBottom: 57,
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
})
