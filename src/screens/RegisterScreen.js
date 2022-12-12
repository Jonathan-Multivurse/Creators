import React, { Component } from 'react'
import { StyleSheet, Platform, View, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Linking } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import CheckBox from '@react-native-community/checkbox'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'
import { emailValidator } from '../helpers/emailValidator'
import OTPSender from '../api/api'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class RegisterScreen extends Component {
  constructor(props) {
    super(props)

    this.state = { 
      firstName: '',       
      lastName: '',      
      email: '',      
      firstNameError: '',
      lastNameError: '', 
      emailError: '',
      otpCode: '',
      isLoading: false,

      isAccept: false,
    }
  }

  componentDidMount() {
    this.getAcceptInfo()
  }

  getAcceptInfo = async () => {
    try {
      const acceptValue = await AsyncStorage.getItem('terms_accept')
      console.log("Terms Accept is:", acceptValue);      
      if(acceptValue !== null) {
        const bValue = acceptValue == 'true' ? true : false
        this.setState({isAccept: bValue})
      }
    } catch(e) {
      console.log('Failed read Terms Value.')
    }
  }

  setToggleCheckBox = async(value) => {
    this.setState({isAccept: value})
    const strValue = value ? 'true' : 'false'
    try {
      console.log(this.state.email)
      await AsyncStorage.setItem('terms_accept', strValue)
    } catch (e) {
      console.log('saving user email error')
    }
  }

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  onVerifyPressed = () => {
    if (this.state.isAccept) {
      const firstNameError = nameValidator(this.state.firstName)
      const lastNameError = nameValidator(this.state.lastName)
      const emailError = emailValidator(this.state.email)    

      if (firstNameError  || lastNameError || emailError ) {
        this.updateInputVal(firstNameError, 'firstNameError')
        this.updateInputVal(lastNameError, 'lastNameError')
        this.updateInputVal(emailError, 'emailError')
        return
      }

      var randomNumber = Math.floor(1000 + Math.random() * 9000);
      this.updateInputVal(randomNumber.toString(), 'otpCode')

      OTPSender.sendEmail(this.state.email, randomNumber.toString(), 'verification', this.onSentCode, this.onSentCodeFailed);
      
    } else {
      return
    }    
  }

  onSentCodeFailed = () => {
    this.setState({
      isLoading: false
    })  
  }

  onSentCode = () => {
    this.props.navigation.navigate('RegisterVerificationScreen', {
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      email: this.state.email,
      codeOTP: this.state.otpCode,
    })   

    this.setState({
      firstName: '',       
      lastName: '',      
      email: '', 
    }) 
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
          <PageTitle>Register</PageTitle>
          <TouchableOpacity onPress={() => this.props.navigation.navigate('LoginScreen')} style={styles.rightButton}>
            <Text style={styles.rightText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style = {styles.contentView}>

          <Text style={styles.firstNameText}>First name</Text>
          <TextInput
            style={styles.emailInput}
            value={this.state.firstName}
            onChangeText={ (text) => this.updateInputVal(text, 'firstName') }
            autoCapitalize="none"
            autoCompleteType="name"
            textContentType="name"
            keyboardType="name-phone-pad"
          />

          <Text style={styles.lastNameText}>Last name</Text>
          <TextInput
            style={styles.emailInput}
            value={this.state.lastName}
            onChangeText={ (text) => this.updateInputVal(text, 'lastName') }
            autoCapitalize="none"
            autoCompleteType="name"
            textContentType="name"
            keyboardType="name-phone-pad"
          />

          <Text style={styles.lastNameText}>Email</Text>
          <TextInput
            style={styles.emailInput}
            value={this.state.email}
            onChangeText={ (text) => this.updateInputVal(text, 'email') }
            autoCapitalize="none"
            autoCompleteType="email"
            textContentType="emailAddress"
            keyboardType="email-address"
          />

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 557 : DEVICE_HEIGHT - 563}} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.loginButton} onPress={() => this.onVerifyPressed()}>
            <Text style={styles.loginText}>Continue</Text>
          </TouchableOpacity>

          <View style={styles.termsView}>
            <CheckBox
              style={{marginRight: 12}}
              disabled={false}
              value={this.state.isAccept}
              onValueChange={(newValue) => this.setToggleCheckBox(newValue)}
            />

            <View style={styles.termsView1}>
              <Text style={styles.byText}>By continuing you agree to </Text>
              <TouchableOpacity onPress={() => this.openTerms()}>
                <Text style={styles.termsText}>Terms and Conditions.</Text>
              </TouchableOpacity>
            </View>
          </View>

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

  rightButton: {
    position: 'absolute',
    height: 50,
    bottom: 0,
    right: 0,
    paddingBottom: 8,
    paddingRight: 16,
    justifyContent: 'flex-end',
  },

  rightText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: theme.colors.primary
  },

  contentView: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  firstNameText: {
    height: 20,
    marginTop: 42,
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

  lastNameText: {
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  forgotText: {
    height: 60,
    paddingTop: 16,
    alignSelf: 'center',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
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
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },

  termsView: {
    height: 41,
    marginBottom: 69,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row'
  },

  termsView1: {
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
