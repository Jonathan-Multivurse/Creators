import React, { Component } from 'react'
import { Image } from 'react-native'
import CustomTabNav  from '../components/CustomTabNav'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Host, Portal } from 'react-native-portalize';
import { theme } from '../core/theme'

import {
  HomeAdmin,  
  SupportAdmin,
  NotificationAdmin,
  AccountAdmin,
} from "./";
import AsyncStorage from '@react-native-async-storage/async-storage'
import firestore from '@react-native-firebase/firestore'
import {firebase} from "@react-native-firebase/auth"

const Tab = createBottomTabNavigator();

export default class DashboardAdmin extends Component {
  constructor(props) {
    super(props)
    this._observer = null;

    this.state = {
      alertFlag: '',  
    };
  }

  getAdminTabBarIcon = (focused, iconName, flag ) => {
    var activeurl = '';
    var inactiveurl = '';
    var flagurl = '';

    if (iconName == 'Home'){
      activeurl = require('../assets/images/bottom/Home_yellow.png');
      inactiveurl = require('../assets/images/bottom/Home.png');
      flagurl = require('../assets/images/bottom/Home.png');
    } else if (iconName == 'Support'){
      activeurl = require('../assets/images/bottom/Support_yellow.png');
      inactiveurl = require('../assets/images/bottom/Support.png');
      flagurl = require('../assets/images/bottom/Support.png');
    } else if (iconName == 'Notification'){
      activeurl = require('../assets/images/bottom/Notification_yellow.png');
      inactiveurl = require('../assets/images/bottom/Notification.png');
      flagurl = require('../assets/images/bottom/Notification_alert.png');
    } else if (iconName == 'Account'){
      activeurl = require('../assets/images/bottom/Account_yellow.png');
      inactiveurl = require('../assets/images/bottom/Account.png');
      flagurl = require('../assets/images/bottom/Account.png');
    }

    return (
      <Image
        style={{ width: focused ? 28 : 26, height: focused ? 28 : 26 }}
        source={focused ? activeurl : flag? flagurl : inactiveurl }
      />
    )
  }

  componentDidMount() {
    const userID = firebase.auth().currentUser.uid;
    this._observer = firestore().collection('notification').where('receivers', 'array-contains', userID)
    .onSnapshot(querySnapshot => {
      if (querySnapshot && querySnapshot.docChanges().length == 1 ){
        this.storeNotficationFlag('true') 
      }      
    });
  }

  componentWillUnmount() {
    this._observer();
  }

  getSavedFlag = async () => {
    try {
      const isFlag =await AsyncStorage.getItem('new_alert')      
      if (isFlag) {
        this.setState({alertFlag: isFlag})
      }      
    } catch(e) {
      console.log('Reading AlertFlag Error')
    }
  }

  storeNotficationFlag = async (value) => {
    try {
      await AsyncStorage.setItem('new_alert', value)
      this.getSavedFlag()
    } catch (e) {
      console.log('Saving Error');
    }
  }

  render() {
    this.getSavedFlag()


    return (
      <Host>
      <CustomTabNav
         screenOptions={{
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor:theme.colors.lightGray,
          unmountOnBlur: true,
          style: {
            backgroundColor: theme.colors.navBar,
          }
        }}
        removeClippedSubviews
      >
        <Tab.Screen
          name={"Home Screen"}
          component={HomeAdmin}
          options={() => ({
            tabBarIcon: ({focused, color }) => this.getAdminTabBarIcon(focused, 'Home', false),
            tabBarLabel: "Home",
            headerShown: false,
          })}
        />
       <Tab.Screen
          name={"Support Screen"}
          component={SupportAdmin}
          options={() => ({
            tabBarIcon: ({focused, color }) => this.getAdminTabBarIcon(focused, 'Support', false),
            tabBarLabel: "Support",
            headerShown: false,
          })}
        />
        <Tab.Screen
          name={"Notifications Screen"}
          component={NotificationAdmin}
          options={() => ({
            tabBarIcon: ({focused, color }) => this.getAdminTabBarIcon(focused, 'Notification', this.state.alertFlag == 'true'),
            tabBarLabel: "Notifications",
            headerShown: false,
          })}
        />
        <Tab.Screen
          name={"Account Screen"}
          component={AccountAdmin}
          options={() => ({
            tabBarIcon: ({focused, color }) => this.getAdminTabBarIcon(focused, 'Account', false),
              tabBarLabel: "Account",
              headerShown: false,
          })}
        />
      </CustomTabNav>
      </Host>
    );
  }
}
