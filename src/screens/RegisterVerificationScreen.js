import React, { useState, useRef, useEffect } from 'react'
import { Platform, StyleSheet, View, TouchableOpacity, Text, Dimensions, TouchableWithoutFeedback, Keyboard, Linking } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import CustomTextInput from '../components/CustomTextInput'
import { theme } from '../core/theme'
import OTPSender from '../api/api'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const RESEND_OTP_TIME_LIMIT = 60;
let resendInterval;

export default function RegisterVerificationScreen({route, navigation }) {
  const { firstName, lastName, email, codeOTP } = route.params;
  const [code, setCode] = useState({code: codeOTP})
  const [otpArray, setOtpArray] = useState(['', '', '', '']);
  const [resendButtonDisabledTime, setResendButtonDisabledTime] = useState(0);

  const onSubmitPressed = () => {
    var typedCode = JSON.stringify(otpArray.join(""));
    if (JSON.stringify(code.code) === typedCode){
      navigation.navigate('RegisterPasswordScreen', {
        firstName: firstName,
        lastName: lastName,
        email: email,
      } );
    }    
  }

  useEffect(() => {
    startResendOtpTimer();

    return () => {
      if (resendInterval) {
        clearInterval(resendInterval);
      }
    };
  }, [resendButtonDisabledTime]);

  const startResendOtpTimer = () => {
    if (resendInterval) {
      clearInterval(resendInterval);
    }

    resendInterval = setInterval(() => {
      if (resendButtonDisabledTime <= 0) {
        clearInterval(resendInterval);
      } else {
        setResendButtonDisabledTime(resendButtonDisabledTime - 1);
      }
    }, 1000);
  };

  const onResendOtpButtonPress = () => {   
    var randomNumber = Math.floor(1000 + Math.random() * 9000);
    console.log(randomNumber.toString());
    setCode({code: randomNumber.toString()})

    OTPSender.sendEmail(email, randomNumber.toString(), 'verification', onSentCode, onSentCodeFailed)

    if (inputRef1) {
      setOtpArray(['', '', '', '']);
      inputRef1.current.focus();
    }
    setResendButtonDisabledTime(RESEND_OTP_TIME_LIMIT);
    startResendOtpTimer();
  };

  const onSentCode = () => {
  }

  const onSentCodeFailed = () => {
  }

  const refCallback = textInputRef => node => {
    textInputRef.current = node;
  };
  
  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const inputRef3 = useRef(null);
  const inputRef4 = useRef(null);

  const onOptChange = (index) => {
    return (value) => {
      if (isNaN(Number(value))) {
        return;
      }
      const otpArrayCpy = otpArray.concat();
      otpArrayCpy[index] = value;
      setOtpArray(otpArrayCpy);
      if (value !== '') {
        if (index === 0) {
          inputRef2.current.focus();
        } else if (index === 1) {
          inputRef3.current.focus();
        } else if (index === 2) {
          inputRef4.current.focus();
        } else if (index === 3) {
          Keyboard.dismiss()
        }
      }
    };
  };

  const onOtpKeyPress = (index) => {
    return ({ nativeEvent: { key: value } }) => {
      if (value === 'Backspace' && otpArray[index] === '') {
        if (index === 1) {
            inputRef1.current.focus();
        } else if (index === 2) {
            inputRef2.current.focus();
        } else if (index === 3) {
            inputRef3.current.focus();
        }
        if (Platform.OS === 'android' && index > 0) {
            const otpArrayCpy = otpArray.concat();
            otpArrayCpy[index - 1] = '';
            setOtpArray(otpArrayCpy);
        }
      }
    };
  };

  const openTerms = async () => {
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

  return (
    <TouchableWithoutFeedback  accessible={false}>
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={navigation.goBack} />
          <PageTitle>Email Verification</PageTitle>
        </View>

        <View style = {styles.contentView}>
          <Text style={styles.enterText}>Enter OTP sent to</Text>
          <Text style={styles.emailText}>{email}</Text>

          <View style={styles.inputView}>
            {[inputRef1, inputRef2, inputRef3, inputRef4].map(
              (inputRef, i) => (
                <CustomTextInput
                  containerStyle={styles.OTPTextView}
                  value={otpArray[i]}
                  onKeyPress={onOtpKeyPress(i)}
                  onChangeText={onOptChange(i)}
                  keyboardType="numbers-and-punctuation"                
                  textContentType="oneTimeCode"
                  maxLength={1}
                  autoFocus={i === 0 ? true : false}
                  refCallback={refCallback(inputRef)}
                  key={i}
                  style={[styles.otpText]}
                />
              )
            )}
          </View>

          <View style={styles.resendView}>
            <Text style={styles.didnotText}>Didn't receive the OTP?  </Text>
            <TouchableOpacity style={{height: 40}} onPress={onResendOtpButtonPress}>
              <Text style={ resendButtonDisabledTime > 0 ? styles.resendButtonDisabled : styles.resendButton }>RESEND OTP</Text>
            </TouchableOpacity>
          </View>

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 543 : DEVICE_HEIGHT - 549}} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.loginButton}onPress={onSubmitPressed}>
            <Text style={styles.loginText}>Submit</Text>
          </TouchableOpacity>

          <View style={styles.termsView}>
            <Text style={styles.byText}>By continuing you agree to </Text>
            <TouchableOpacity onPress={() => openTerms()}>
              <Text style={styles.termsText}>Terms and Conditions.</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Background>
    </TouchableWithoutFeedback>
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
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  enterText: {
    marginTop: 42,
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },

  emailText: {
    fontSize: 20,
    marginBottom: 60,
    fontFamily: 'Poppins-Bold',
  },

  inputView: {
    flexDirection: 'row',
    marginHorizontal: (DEVICE_WIDTH - 324)/2,  
    height: 49,
  },

  OTPTextView: {
    flex: 1,
    height: 49,
    width: 49,
    marginHorizontal: 16,
    backgroundColor: theme.colors.inputBar,
  },

  otpText: {
    textAlign: 'center',    
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
  },

  resendView: {
    flexDirection: 'row',
    marginTop: 36,
  },

  didnotText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  }, 

  resendButton: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.primary,
  },

  resendButtonDisabled: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Medium',  
    color: theme.colors.primaryDisabled,
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