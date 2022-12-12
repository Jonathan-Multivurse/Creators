import React, { Component } from 'react'
import { StyleSheet, Platform, View, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Image, Modal, ScrollView, Alert, ActionSheetIOS} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'
import USER_DB from '../api/userDB'
import SURVEY_DB from '../api/surveyDB'
import moment from 'moment'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class SurveyActiveDetail extends Component {
  constructor(props) {
    super(props);   
    USER_DB.getCustomers(this.onUserGet)

    this.state = { 
      isLoading: false,
      survey: this.props.route.params.survey, 
      status: this.props.route.params.survey.status,
      iCustomers: 1
    }
  }

  onUserGet = (count) => {
    this.setState({
      iCustomers: count
    })
  } 

  onViewPressed = () => {
    this.props.navigation.navigate('SurveyAnalyzeScreen', {
      survey: this.state.survey
    })     
  }

  onReNotify = () => {
    Alert.alert(
      'Re-Notify Customers',
      `Customers will receive another notification of survey.`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Re-Notify",
          onPress: () => {
            this.setState({
              isLoading: true,
            })
            SURVEY_DB.updateDSurvey(this.state.survey.surveyId, {status: 1, date: new Date().getTime()}, this.onNotifySuccess)            
          },
        },
        
      ],
      { cancelable: false }
    );
    
  }

  onNotifySuccess= async () => {    
    this.setState({
      isLoading: false,
    })
  };

  onClosePressed = () => {   
    Alert.alert(
      'Close Survey?',
      `A survey will no longer available to fill, still you can see the received entries.`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Close",
          onPress: () => {
            this.setState({
              isLoading: true,
            })
            SURVEY_DB.updateDSurvey(this.state.survey.surveyId, {status: 2, date: new Date().getTime()}, this.onCloseSuccess)            
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  onCloseSuccess= async () => {    
    this.setState({
      isLoading: false,
      status: 2,
    })
  };

  render() {
    return (
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>{this.state.survey.title}</PageTitle>
          {/* <TouchableOpacity style={styles.rightButton} onPress={this.showActionSheet} >
            <Image
              style={styles.rightImage}
              source={require('../assets/images/survey/icon_dot_yellow.png')}
            />
          </TouchableOpacity> */}
        </View>

        <ScrollView style={{flex: 1, width: DEVICE_WIDTH }} nestedScrollEnabled={true}>
          <Text style={styles.submissionsText}>{this.state.survey.submissions}</Text>
          <Text style={styles.totalText}>Total Responses</Text>

          <View style={{...styles.statusView, backgroundColor: this.state.status == 2 ? '#FF3B30' : '#2BCC71'}}>
              <Text style={styles.statusText}>{this.state.status == 2 ? 'Completed'  :  'Active'} </Text> 
          </View> 

          <View style={{...styles.changeView, marginTop: 36}}>
              <Text style={styles.changeText}>Total Customers</Text>
              <View style={{flex: 1}}/>
              <Text style={styles.resultText}>{this.state.iCustomers}</Text>
          </View>

          <View style={styles.changeView}>
              <Text style={styles.changeText}>Completion Rate</Text>
              <View style={{flex: 1}}/>
              <Text style={styles.resultText}>{(100 * this.state.survey.submissions/this.state.iCustomers).toFixed(1)} %</Text>
          </View>

          <View style={styles.changeView}>
              <Text style={styles.changeText}>Created on</Text>
              <View style={{flex: 1}}/>
              <Text style={styles.resultText}>{moment(this.state.survey.date).format('DD MMMM YYYY')}</Text>
          </View>

          <View style={{height: this.state.status == 2 ?  DEVICE_HEIGHT - 624 : DEVICE_HEIGHT - 770 }} />

          <TouchableOpacity style={styles.saveButton} onPress={() => this.onViewPressed()}>                
            <Text style={styles.saveText}>View Details</Text>
          </TouchableOpacity>

          { this.state.status == 2 ? null : <TouchableOpacity style={styles.reNotifyButton} onPress={() => this.onReNotify()}>
              <Image  style={styles.coloseImage} source={require('../assets/images/survey/bell-icon.png')} />
              <Text style={styles.closeText}>Re-Notify</Text>
            </TouchableOpacity>
          }

          { this.state.status == 2 ? null : <TouchableOpacity style={{...styles.reNotifyButton, marginBottom: 57 }} onPress={() => this.onClosePressed()}>
              <Image  style={styles.coloseImage} source={require('../assets/images/survey/close-icon.png')} />
              <Text style={styles.closeText}>Close Survey</Text>
            </TouchableOpacity> 
          }

        </ScrollView>

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

  submissionsText: {
    marginTop: 40,
    alignSelf: 'center',
    fontSize: 48,
    fontFamily: 'Poppins-Medium',
  },

  totalText: {
    alignSelf: 'center',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.darkGray
  },

  statusView: {
    height: 27,
    marginTop: 12,  
    alignSelf: 'center', 
    borderRadius: 13.5,
    paddingHorizontal: 12, 
    paddingTop: 2,
    backgroundColor: '#2BCC71'
  },

  statusText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium', 
    color: 'white',
  },

  changeView: {
    height: 45,
    marginHorizontal: 16,
    marginTop: 9,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',  
  },

  changeText: {    
    height: 21,
    marginLeft: 14,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
  },

  resultText: {
    height: 21,
    marginRight: 14,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',   
    color: theme.colors.darkBlue
  },

  saveButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginLeft: 24,
    marginTop: 40,
    borderRadius: 28.5,
    backgroundColor: theme.colors.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  saveText: {
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: 'white',
  },

  reNotifyButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginLeft: 24,
    marginTop: 16,
    borderRadius: 28.5,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.colors.darkBlue,
    borderWidth: 1.5,
    flexDirection: 'row',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  closeText: {
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
  },

  coloseImage: {
    position: 'absolute',
    top: 11,
    left: 22,
    width: 32,
    height: 32,
  },  
})
