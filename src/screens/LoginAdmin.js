import React, { Component } from 'react'
import { StyleSheet, View, Platform, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Alert, Linking } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { emailValidator } from '../helpers/emailValidator'
import { passwordValidator } from '../helpers/passwordValidator'
import EMAIL_AUTH from '../api/userAuth'
import USER_DB from '../api/userDB'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class LoginAdmin extends Component {
  constructor(props) {
    super(props);   
    this._unsubscribeFocus = null;

    this.state = { 
      isLoading: false,
      email: '',
      password: '',   
      emailError: '', 
      passwordError: '',     
      token: '',
    }
  }

  componentDidMount() {
    this.getUserInfo()
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getUserInfo()
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
  }

  getUserInfo = async () => {

    try {
      const emailValue = await AsyncStorage.getItem('admin_email')
      if(emailValue !== null) {
        this.setState({email: emailValue})
      }
    } catch(e) {
      console.log('Failed read User Email.')
    }

    try {
      const passwordValue = await AsyncStorage.getItem('admin_password')
      if(passwordValue !== null) {
        this.setState({password: passwordValue})
      }
    } catch(e) {
      console.log('Failed read User Password.')
    }

    try {
      const tokenValue = await AsyncStorage.getItem('user_token')
      if(tokenValue !== null) {
        this.setState({token: tokenValue})
      } 
    } catch(e) {
      console.log('Failed read User Token.')
    }

  }

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  onLoginPressed = () => {
    const emailError = emailValidator(this.state.email)
    const passwordError = passwordValidator(this.state.password)

    if (emailError || passwordError) {
      this.updateInputVal(emailError, 'emailError')
      this.updateInputVal(passwordError, 'passwordError')
      return
    }

    this.setState({
      isLoading: true,
    })

    EMAIL_AUTH.onPressLoginAdmin(this.state.email, this.state.password, this.state.token, this.onUserSuccess, this.onFake, this.onUserLoginFail);
  }

  onUserSuccess= async () => {    
    try {
      await AsyncStorage.setItem('admin_email', this.state.email)
    } catch (e) {
      console.log('saving user email error')
    }

    try {
      await AsyncStorage.setItem('admin_password', this.state.password)
    } catch (e) {
      console.log('saving user password error')
    }

    this.setState({
      isLoading: false,
      emailError: '',
      passwordError: '',
    })

    USER_DB.checkAdminProfile(this.goDashboard, this.goSetProfile)   
  };

  onFake = async () => {    
    this.setState({
      isLoading: false,
    })

    Alert.alert(
      "Error",
      `Permission was denied with ${this.state.email}`,
      [
        {
          text: "OK",
          onPress: () => console.log("OK Pressed")
        },
      ],
      { cancelable: false }
    );    
  };

  onUserLoginFail = async () => {
    this.setState({
      isLoading: false,
    })
  }

  goDashboard = () => {   
    this.props.navigation.navigate('DashboardAdmin');
  };

  goSetProfile = () => {       
    this.props.navigation.navigate('SetProfileAdmin');
  };

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

  onPasswordReset = () => {
    this.props.navigation.navigate('ChangePassword', {
      title: "Password Reset"
    }) 
  }

  render() {
    return (
      <Background>

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Admin Login</PageTitle>
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

          <Text style={styles.passwordText}>Password</Text>
          <TextInput
            style={styles.emailInput}
            value={this.state.password}
            onChangeText={ (text) => this.updateInputVal(text, 'password') }
            secureTextEntry={true}
          />

          <TouchableOpacity onPress={() => this.onPasswordReset()} >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 522 : DEVICE_HEIGHT - 528}} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.loginButton} onPress={() => this.onLoginPressed()}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.termsView}>
            <Text style={styles.byText}>By continuing you agree to </Text>
            <TouchableOpacity onPress={() => this.openTerms()}>
              <Text style={styles.termsText}>Terms and Conditions.</Text>
            </TouchableOpacity>
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

  passwordText: {
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
