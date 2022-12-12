import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import {
  StartScreen,
  LoginScreen,
  ChangePassword,
  ChangeVerification,
  ChangePasswordScreen,
  ResetPasswordScreen,
  RegisterScreen,
  RegisterVerificationScreen, 
  RegisterPasswordScreen,
  RegisterProfileScreen,
  RegisterWaiting,
  RegisterApproved,  
  Dashboard,
  ScheduleRequests,
  ScheduleSupport,
  SupportChat,
  SupportSearch,
  ManageAvailability,
  WeeklyAvailability,
  RatingReviewScreen,
  SupportDetail,

  LoginAdmin,
  SetProfileAdmin,
  DashboardAdmin,
  ScheduleRequestsAdmin,
  ScheduleSupportAdmin,
  SupportSearchAdmin,
  ManageComReps,
  ManageComRepsSearch,
  ManageComProfile,
  CallScreen,
  Messages,
  SurveysScreen,  
  SurveyNew,  
  SurveyQuestionEdit,
  SurveyDetail,
  SurveyActiveDetail,
  SurveyAnalyzeScreen,
  ImageViewer,
  VideoPlayer,
  AssignSupport,
  FacilityScreen,
  FacilitySimulators,
  FacilityCodeShare,
  TimeZone,
} from './screens'
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { appStart } from './actionCreators'
import config from './QBConfig'
import QB from 'quickblox-react-native-sdk'
import FlashMessage from "react-native-flash-message";
import { showMessage, hideMessage } from "react-native-flash-message";
import { navigationRef } from './NavigationService';
import REQUEST_DB from './api/requestDB';

const Stack = createStackNavigator()

function App() {
  
  useEffect(() => {
    const appSettings = {
      appId: '90951',
      authKey: 'EsbJb9fnCs8VHEn',
      authSecret: 'YUwQJ8rtamDjN36',
      accountKey: 'RQfzw5xYhyX7_fvk5zLH',
      apiEndpoint: '',
      chatEndpoint: '',
    };
    
    QB.settings
      .init(appSettings)
      .then(() => {
        // SDK initialized successfully
        console.log('QB SDK initialized successfully')
      })
      .catch((e) => {
        // Some error occurred, look at the exception message for more details
        console.log('QB SDK initialized Failed')
      });
  
    QB.settings.enableAutoReconnect({ enable: true })
    QB.settings.enableCarbons()
    QB.settings.initStreamManagement({
      autoReconnect: true,
      messageTimeout: 10
    })

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log(remoteMessage);
      let notification = remoteMessage.notification
      let notificationTitle = notification.title
      let notificationBody = notification.body

      let messageData = remoteMessage.data    
      let notificationType = messageData.type 
      storeNotficationFlag();

      if (notificationType == 'reconnectedCall' && messageData.request != "" ) {
        console.log("Message data  ==>", messageData)
        REQUEST_DB.getRequest(messageData.request, getRequest);
      } else {
        showMessage({
          message: notificationTitle,
          description: notificationBody,
          type: 'default',
          backgroundColor: '#D7843B',
          color: 'white',
        });
      }      
    });

    return unsubscribe;
  }, []);

  const getRequest = async(request) => {
    console.log("Global Request ===>", request)
    global.selectedRequest = request
  }

  const storeNotficationFlag = async() => {
    try {
      await AsyncStorage.setItem('new_alert', 'true')
    } catch (e) {
      console.log('Saving Error');
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="StartScreen"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false
        }}
      >
        <Stack.Screen name="StartScreen" component={StartScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />  
        <Stack.Screen name="ChangeVerification" component={ChangeVerification} />   
        <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} /> 
        <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />        
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="RegisterVerificationScreen" component={RegisterVerificationScreen} />
        <Stack.Screen name="RegisterPasswordScreen" component={RegisterPasswordScreen} />          
        <Stack.Screen name="RegisterProfileScreen" component={RegisterProfileScreen} />
        <Stack.Screen name="RegisterWaiting" component={RegisterWaiting} />
        <Stack.Screen name="RegisterApproved" component={RegisterApproved} />
        <Stack.Screen name="Dashboard" component={Dashboard} screenOptions = {{headerShown: false}} />
        <Stack.Screen name="ScheduleRequests" component={ScheduleRequests} />
        <Stack.Screen name="ScheduleSupport" component={ScheduleSupport} />
        <Stack.Screen name="SupportChat" component={SupportChat} />
        <Stack.Screen name="SupportSearch" component={SupportSearch} />
        <Stack.Screen name="ManageAvailability" component={ManageAvailability} />
        <Stack.Screen name="WeeklyAvailability" component={WeeklyAvailability} />
        <Stack.Screen name="RatingReviewScreen" component={RatingReviewScreen} />     
        <Stack.Screen name="SupportDetail" component={SupportDetail} />    
              
        <Stack.Screen name="LoginAdmin" component={LoginAdmin} />
        <Stack.Screen name="SetProfileAdmin" component={SetProfileAdmin} />          
        <Stack.Screen name="DashboardAdmin" component={DashboardAdmin} screenOptions = {{headerShown: false}} />
        <Stack.Screen name="ScheduleRequestsAdmin" component={ScheduleRequestsAdmin} /> 
        <Stack.Screen name="ScheduleSupportAdmin" component={ScheduleSupportAdmin} />
        <Stack.Screen name="SupportSearchAdmin" component={SupportSearchAdmin} />   
        <Stack.Screen name="ManageComReps" component={ManageComReps} />    
        <Stack.Screen name="ManageComRepsSearch" component={ManageComRepsSearch} /> 
        <Stack.Screen name="CallScreen" component={CallScreen} />   
        <Stack.Screen name="SurveysScreen" component={SurveysScreen} />  
        <Stack.Screen name="SurveyNew" component={SurveyNew} />  
        <Stack.Screen name="SurveyQuestionEdit" component={SurveyQuestionEdit} />  
        <Stack.Screen name="SurveyDetail" component={SurveyDetail} /> 
        <Stack.Screen name="SurveyActiveDetail" component={SurveyActiveDetail} /> 
        <Stack.Screen name="SurveyAnalyzeScreen" component={SurveyAnalyzeScreen} /> 
        
        <Stack.Screen name="Messages" component={Messages} />  
        <Stack.Screen name="ImageViewer" component={ImageViewer} /> 
        <Stack.Screen name="VideoPlayer" component={VideoPlayer} /> 
        <Stack.Screen name="AssignSupport" component={AssignSupport} /> 
        <Stack.Screen name="FacilityScreen" component={FacilityScreen} />
        <Stack.Screen name="FacilitySimulators" component={FacilitySimulators} />  
        <Stack.Screen name="FacilityCodeShare" component={FacilityCodeShare} />    
        <Stack.Screen name="ManageComProfile" component={ManageComProfile} /> 
        <Stack.Screen name="TimeZoneScreen" component={TimeZone} />        
      </Stack.Navigator>
      <FlashMessage position="top" duration={6000}/> 
    </NavigationContainer>
  );
}

const mapStateToProps = null
const mapDispatchToProps = { appStart }
export default connect(mapStateToProps, mapDispatchToProps)(App)