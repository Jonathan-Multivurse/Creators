import React, { Component } from 'react'
import { StyleSheet, Platform, View, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { passwordValidator } from '../helpers/passwordValidator'
import EMAIL_AUTH from '../api/userAuth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import auth, {firebase} from "@react-native-firebase/auth"

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class ChangePasswordScreen extends Component {  
  constructor(props) {
    super(props)    

    this.state = { 
      password: '',      
      cpassword: '',
      passwordError: '',
      cpasswordError: '',
      isLoading: false,
      title: this.props.route.params.title,
      email: this.props.route.params.email,
      token: '',
    }
  }

  componentDidMount() {  
    this.getUserInfo()
  }

  getUserInfo = async () => {
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
  
  onChangePressed = () => {
    const passwordError = passwordValidator(this.state.password)
    const cpasswordError = passwordValidator(this.state.cpassword)

    if (passwordError || cpasswordError ) {
      this.updateInputVal(passwordError, 'passwordError')
      this.updateInputVal(cpasswordError, 'cpasswordError')
      return
    }

    if (this.state.password === this.state.cpassword) {
      
      this.setState({
        isLoading: true,
      })

      // if (auth().currentUser) {
      //   EMAIL_AUTH.onChangePassword(this.state.password, this.onChanged, this.onChangeFail)
      // } else {      
        fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/changePassword', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            useremail: this.state.email,
            password: this.state.password
          }),
        })
        .then((response) => response.json())
        .then((responseJson) => {

          console.log("response ===>", responseJson)

          if (responseJson.statusCode !== 200) {
            this.setState({
              isLoading: false,
            });
            // alert(responseJson.error);
            return;
          }

          this.onChanged()
        })
        .catch((err) => {        
          this.setState({
            isLoading: false,
          });
          Alert.alert('Network Error', 'Please check your network connection and try again.')
        });        
      // }      
    } else {
      Alert.alert(
        "Error",
        `Passwords do not match. Please type again.`,
        [
          {
            text: "Ok",
            onPress: () => {
            },
          },
        ],
        { cancelable: false }
      );
      return
    }
  }

  onChanged = async() => {
    try {
        await AsyncStorage.setItem('rep_password', this.state.password)
      } catch (e) {
        console.log('saving user password error')
    }    

    this.setState({
      isLoading: false
    })

    Alert.alert(
      'Successful',
      this.state.title == 'Change Password' ? `Changing password is successful done. Please proceed and login.` : `Resetting password is successful done. Please proceed and login.`,
      [
        {
          text: "Ok",
          onPress: () => { 
            this.setState({
              password: '',
              passwordError: '',
              cpassword: '',
              cpasswordError: '',
            })
            this.props.navigation.navigate('StartScreen')                        
          },
        },          
      ],
      { cancelable: false }
    );

    
  }

  onChangeFail = () => {
    this.setState({
      isLoading: false,
    })
  }

  render() {
    return (
      <Background>

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>{this.state.title}</PageTitle>
        </View>

        <View style = {styles.contentView}>
          <Text style={styles.passwordText}>Create a password</Text>
          <TextInput
            style={styles.emailInput}
            returnKeyType="next"
            value={this.state.password}
            onChangeText={ (text) => this.updateInputVal(text, 'password') }
            secureTextEntry
          />

          <Text style={styles.verifyText}>Verify password</Text>
          <TextInput
            style={styles.emailInput}
            returnKeyType="done"            
            value={this.state.cpassword}
            onChangeText={ (text) => this.updateInputVal(text, 'cpassword') }
            secureTextEntry
          />

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 385 : DEVICE_HEIGHT - 391}} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.doneButton} onPress={() => this.onChangePressed()}>
            <Text style={styles.doneText}>Done</Text>
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

  passwordText: {
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

  verifyText: {
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  doneButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginBottom: 63,
    borderRadius: 28.5,
    backgroundColor: theme.colors.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  doneText: {
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
