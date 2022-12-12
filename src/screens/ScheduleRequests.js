import React, { Component } from 'react'
import { View, Platform, StyleSheet, Image, Dimensions, Text, SectionList, TouchableWithoutFeedback } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import moment from 'moment';

const DEVICE_WIDTH = Dimensions.get('window').width

export default class ScheduleRequests extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedRequests: this.props.route.params.requests,
    };   
  }

  selectRow = (item) => {
    this.props.navigation.navigate('ScheduleSupport', {
      request: item
    })
  }

  render() {
    var targetDates = []
    var targetRequests = []

    var date = new Date();
    date.setDate(date.getDate() + 1);
    const today = moment().format('MMM DD, yyyy')
    const tomorrow = moment(date).format('MMM DD, yyyy')

    this.state.selectedRequests.forEach(request => {
      const tmpDate = new Date(request.scheduleTime)
      const key = moment(tmpDate).format('MMM DD, yyyy')

      const dateString = (key == today) ? 'Today' :  (key == tomorrow) ? 'Tomorrow' : key

      if (targetDates.includes(dateString)) {
        const tmpIndex = targetDates.indexOf(dateString)
        var aryTemp = targetRequests[tmpIndex].data
        aryTemp.push(request)

        targetRequests.splice(tmpIndex, 1);
        targetRequests.splice(tmpIndex, 0, {title: dateString, data: aryTemp})
      } else {
        targetDates.push(dateString)
        var subRequests = []
        subRequests.push(request)
        targetRequests.push({title: dateString, data: subRequests})
      }
    })

    return (
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />         
          <PageTitle>Schedules</PageTitle>
        </View>

        <View style={styles.listView}>

          <SectionList
            sections={targetRequests}
            keyExtractor={(item, index) => item + index}
            renderItem={({ item, index }) => (
              <TouchableWithoutFeedback onPress={() => this.selectRow(item)}>
                <View key={index} style={styles.vItem}>
                  <View style={styles.hImageView}>
                    <Image source={ item.type === 'Video' ? require('../assets/images/home/iconVideo.png') : item.type === 'Call' ? require('../assets/images/home/iconVoice.png') : require('../assets/images/home/iconChat.png')} style={styles.hImage} />
                  </View> 
                  <View>
                    <Text style={styles.hText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                    <Text style={styles.hTime}>{moment(new Date(item.scheduleTime)).format('hh:mm A')}</Text>
                  </View>                      
                </View>
              </TouchableWithoutFeedback>
            )}
            renderSectionHeader={({ section: { title } }) => (
              <View style = {styles.sectionView}>
                <Text style={styles.sectionText}>{title}</Text>
              </View>
            )}
          />
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

  listView: {
    width: DEVICE_WIDTH - 32,
    marginTop: 16,
    marginBottom: 16,
    flex: 1,
  },

  scheduleText: {
    marginTop: 24, 
    marginBottom: 7,
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.darkGray
  },

  vItem: {
    width: '100%',
    height: 70,
    marginTop: 7,
    marginBottom: 7,                      
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    justifyContent: 'flex-start',
    flexDirection: 'row',    
  },

  hImageView: {
    marginTop: 15,
    marginLeft: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignContent: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  hImage: {
    width: 20,
    height: 20,
    alignSelf: 'center'
  },

  hText: {
    marginTop: 14,
    marginLeft: 12,
    fontSize: 16,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  hTime: {
    marginLeft: 12,
    marginTop: 2,
    fontSize: 13,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },

  sectionView: {
    width: DEVICE_WIDTH,
    height: 30,
    backgroundColor: 'white',
  },

  sectionText: {    

    paddingTop: 12,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader
  },
})