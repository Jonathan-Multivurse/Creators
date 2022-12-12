import React, { Component, useRef } from 'react'
import { StyleSheet, View, Platform, TouchableOpacity, Text, Image, Dimensions, ActivityIndicator, Alert, SectionList, TextInput, Modal, KeyboardAvoidingView, LogBox, ActionSheetIOS} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { theme } from '../core/theme'
import moment from 'moment'

import RatingView from '../components/RatingView'
import SmartScroll from '../components/SmartScroll'
import TimeCol from '../components/TimeCol'
import DrawnGrid from '../components/DrawnGrid'
import NowBar from '../components/NowBar'
import ApptView from '../components/ApptView'
import todayData from '../services/todayData'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const hour_size = DEVICE_HEIGHT/12

getUserRating = (repRatings) => {
  var userRating = 0  
  if (repRatings.length > 0) {
    let sum = 0
    for(let i = 0; i < repRatings.length; i++){
      let tmp = repRatings[i]
      sum += tmp.star
    }
    
    userRating = (sum/repRatings.length).toFixed(1)
  }      
  return userRating
}

export default class ManageComProfile extends Component {
  constructor(props) {
    super(props)
    this._unsubscribeFocus = null; 
        
    this.state = { 
      isLoading: false,
      rep: this.props.route.params.rep,
      selectedIndex: 0,

      scheduledSupports: [],
      activeSupports: [],
      notifications: [],
      weeklyAvailable: [],
      todayRequests: [],      
      ratings: [],      
    }
  }

  componentDidMount() {
    LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
    this._unsubscribeFocus = this.props.navigation.addListener("focus", () => {
      this.getRepProfile()    
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
  }

  showActionSheet = () => {

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Remove ' + this.state.rep.firstname + ' ' + this.state.rep.lastname, 'Cancel'],
          cancelButtonIndex: 1,
          userInterfaceStyle: 'light'
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            this.onDeletePressed()
          } 
        }
      );
    } else {
      this.ActionSheet.show()
    }
  } 

  onDeletePressed = () => {   
    Alert.alert(
      `Remove ${this.state.rep.firstname} ${this.state.rep.lastname}?`,
      `${this.state.rep.firstname} will no longer be a company representative.`,
      [
        {
          text: 'Cancel',
          onPress: () => {},
        },
        {
          text: 'Remove',
          onPress: () => {
            this.onRemoveRep()              
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  onRemoveRep = () => {
    if ( this.state.scheduledSupports.length + this.state.activeSupports.length  == 0) {
      const userID = this.state.rep.userid;

      this.setState({
        isLoading: true,
      });

      fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/removeRep', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: userID,
        }),
      })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.statusCode !== 200) {
          this.setState({
            isLoading: false,
          });
          // alert(responseJson.error);
          return;
        }

        this.setState({
          isLoading: false,
        });     
        
        this.props.navigation.goBack()
      })
      .catch((err) => {        
        this.setState({
          isLoading: false,
        });
        Alert.alert('Network Error', 'Please check your network connection and try again.')
      });
    } else {
      Alert.alert(
        `${this.state.rep.firstname} has Scheduled & Live supports`,
        `A company representative can not be removed because ${this.state.rep.firstname} has Scheduled & Live supports.`,
        [
          {
            text: 'OK',
            onPress: () => {},
          },
        ],
        { cancelable: false }
      );
    }  
  }

  getRepProfile = () => {
    const userID = this.props.route.params.rep.userid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getRepProfile', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
        });
        // alert(responseJson.error);
        return;
      }

      var arySupports = [...responseJson.scheduled, ...responseJson.active];

      this.setState({
        isLoading: false,
        rep: responseJson.rep,
        scheduledSupports: responseJson.scheduled,
        activeSupports: responseJson.active,
        ratings: responseJson.ratings
      });     

      this.onUserGet(responseJson.rep)
      this.getTargetNotification(responseJson.notifications);
      this.getScheduleTarget(responseJson.scheduled, responseJson.unavailable);
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  onUserGet = (user) => {
    var tmpAvailable = []
    if (user.weeklyAvailable){
      tmpAvailable = user.weeklyAvailable
    } else {
      tmpAvailable.push({
        'days': 0,
        'from': 9,
        'to': 19,
      })
    }

    this.setState({ 
      weeklyAvailable: tmpAvailable,      
    })
  } 

  getTargetNotification = async (notifications) => {    
    var tmpNotifications = [];
    const aryTyypes = ['received', 'assignAccepted', 'repAccepted', 'assign', 'cancelled', 'livereceived'];

    notifications.forEach(item => {
      if (!aryTyypes.includes(item.notification.type)) {
        var tmpItem = item
        var tmpNotification = item.notification
        var tmpMessage = tmpNotification.message
        var targetMessage = ''
        
        if ( tmpMessage.indexOf(' gave you the ratings.') != -1 ) {
          targetMessage = 'Received the rating & review from ' + tmpMessage.replace(' gave you the ratings.', '.')          
        } else if ( tmpMessage.indexOf(' ended the support session.') != -1 ) {
          targetMessage = 'Successfully ended ' + tmpMessage.replace(' ended the support session.',  "'s  support session.")          
        } else if ( tmpMessage.indexOf("'s support request.") != -1 ) {
          targetMessage = tmpMessage.replace("You accepted ",  "Accepeted ")          
        } else if ( tmpMessage.indexOf("You scheduled ") != -1 ) {
          targetMessage = tmpMessage.replace("You scheduled ",  "Scheduled ")          
        } else {
          targetMessage = tmpMessage
        }

        tmpNotification.message = targetMessage
        tmpItem.notification = tmpNotification
        tmpNotifications.push(tmpItem)
      }      
    });

    this.setState({
      notifications: tmpNotifications,    
    })
  }

  getScheduleTarget = (scheduledRequests, arrayUnavailable) => {
    var tmpRequests = []

    scheduledRequests.forEach(request => {
      const startTime = new Date(request.scheduleTime)
      const endTime = new Date(request.scheduleTime + 900*1000)

      tmpRequests.push({
        title: request.type,
        start: startTime,
        end: endTime,
      })
    });

    arrayUnavailable.forEach(item => {
      const startTime = new Date(item.startTime)
      const endTime = new Date(item.startTime + 1800*1000)

      tmpRequests.push({
        title: item.title,
        start: startTime,
        end: endTime,
      })
    });

    this.setState({
      todayRequests: tmpRequests,
    })
  }


  render() {
    // Timeline Data
    var targetDates = []
    var targetTimelines = []

    const today = moment().format('DD MMM yyyy')

    this.state.notifications.forEach(notification => {
      const tmpDate = new Date(notification.notification.time)
      const key = moment(tmpDate).format('DD MMM yyyy')

      const dateString = (key == today) ? 'Today' : key

      if (targetDates.includes(dateString)) {
        const tmpIndex = targetDates.indexOf(dateString)
        var aryTemp = targetTimelines[tmpIndex].data
        aryTemp.push(notification)

        targetTimelines.splice(tmpIndex, 1);
        targetTimelines.splice(tmpIndex, 0, {title: dateString, data: aryTemp})
      } else {
        targetDates.push(dateString)
        var subRequests = []
        subRequests.push(notification)
        targetTimelines.push({title: dateString, data: subRequests})
      }
    })

    // Availability Data
    let startHour = this.state.weeklyAvailable.length === 0 ? 0 : this.state.weeklyAvailable[0].from 
    let endHour = this.state.weeklyAvailable.length === 0 ? 24 : this.state.weeklyAvailable[0].to === 0 ? 24 : this.state.weeklyAvailable[0].to > this.state.weeklyAvailable[0].from ? this.state.weeklyAvailable[0].to : this.state.weeklyAvailable[0].from + 1

    // Ratings Data
    const repRatings = this.state.ratings;  
    var repRatingsData = [];
    var todayRatingtData = [];
    var earlierData = [];

    if (repRatings) {
      for(let i = 0; i < repRatings.length; i++){
        let tmp = repRatings[i]
        const diff = new Date().getTime() - tmp.time;
        if (diff < 24 * 3600) {
          todayRatingtData.push(tmp)
        } else {
            earlierData.push(tmp)
        }        
      }

      if (todayRatingtData.length > 0 ) {
          repRatingsData.push({
          title: "Today",
          data: todayRatingtData,
        })
      }

      if (earlierData.length > 0 ) {
          repRatingsData.push({
          title: "Earlier",
          data: earlierData,
        })
      }
    }

    return (
      <Background>

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Company Representative</PageTitle>
          <TouchableOpacity style={styles.rightButton} onPress={this.showActionSheet} >
            <Image style={styles.rightImage} source={require('../assets/images/survey/icon_dot_yellow.png')} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileView}>
          <View style={styles.profileImageView} >
            <Image style={styles.profileImage} source={{uri: this.state.rep.image}}/>            
            <View style={{...styles.statusView, backgroundColor: this.state.activeSupports.length == 0 ? theme.colors.lightGray : theme.colors.greenColor }}/>           
          </View>

          <View style={styles.profileContentView} >
            <Text style={styles.nameText}>{this.state.rep.firstname + " " + this.state.rep.lastname}</Text>
            <Text style={styles.emailText}>{this.state.rep.email}</Text>

            <View style={styles.ratingView} >
              <RatingView star={getUserRating(this.state.ratings)} type={1}/>
              <Text style={styles.ratingText}>{'(' + this.state.ratings.length.toString() + ')'}</Text>
            </View>

          </View>          
        </View>

        <View style={styles.listView}>

          <SegmentedControl
            style={styles.segementContainer}
            values={[
              'Timeline',
              'Availability',
              'Ratings',
            ]}
            selectedIndex={this.state.selectedIndex}
            onChange={(event) => {
              this.setState({selectedIndex: event.nativeEvent.selectedSegmentIndex});
            }}
            fontStyle={{fontSize: 14, fontFamily: 'Poppins-SemiBold'}}
          />

          { this.state.selectedIndex == 0 ? 
            <SectionList
              contentContainerStyle={{paddingBottom:24,}}
              showsVerticalScrollIndicator={false}
              style={{alignContent: 'center'}}
              sections={targetTimelines}
              keyExtractor={(item, index) => item + index}
              renderSectionHeader={({ section: { title } }) => (
                <View style = {styles.sectionView1}>
                  <Text style={styles.todayText3}>{title}</Text>
                </View>
              )}
              renderItem={({ item }) => (              
                <View style={styles.cellContentView1}>
                  <Text style={styles.timeText1}>{moment(item.notification.time).format('hh:mm A')}</Text>
                  <Text style={styles.nameText1}>{item.notification.message}</Text>
                </View>
              )}              
            /> 
            : this.state.selectedIndex == 1 ? 
              <View style={{width: '100%', flex: 1, justifyContent: 'flex-start',}}>
                <SmartScroll hour_size={hour_size} startHour={startHour} endHour={endHour}>
                  <View style={styles.body}>
                    <View style={styles.hour_col}>
                      <TimeCol hour_size={hour_size} startHour={startHour} endHour={endHour}/>
                    </View>
                    <View style={styles.schedule_col}>
                      <DrawnGrid hour_size={hour_size} startHour={startHour} endHour={endHour}/>
                      <NowBar select_date={new Date()} hour_size={hour_size} startHour={startHour} endHour={endHour}/>
                      
                      { this.state.todayRequests.length > 0 && 
                        <View style={{ width: '100%', height: '100%', position: 'absolute'}}>
                          { todayData(this.state.todayRequests, new Date()).map((row, index) => 
                            <View key={index} style={{...styles.eventView, marginTop: (row.hrsBefore - startHour) * hour_size + 10}}>                        
                              { row.rowAppts.map((appt, i) => 
                                <ApptView key={i} topTime={row.start} appt={appt} hour_size={hour_size} onEventPress={this.onEventPress}/>
                              )}
                            </View>
                          )}
                        </View>
                      }
                    </View>
                  </View>
                </SmartScroll>
              </View>
            : <SectionList
              contentContainerStyle={{paddingBottom:24,}}
              showsVerticalScrollIndicator={false}             
              sections={repRatingsData}
              keyExtractor={(item, index) => item + index}
              renderSectionHeader={({ section: { title } }) => (
                <View style = {styles.sectionView3}>
                  <Text style={styles.todayText3}>{title}</Text>
                </View>
              )}
              renderItem={({item, index}) => (
                <View key={index} style={styles.vItem3}>
                  <RatingView star={item.star} type={0}/>
                  <Text style={styles.nameText3}>{item.writerName}</Text>
                  {item.review == "" ? null : (<Text style={styles.reviewText3}>{item.review}</Text>)}                   
                      
                </View>
              )}            
            />
          }
        </View>  


        { Platform.OS === 'android' && 
          <ActionSheet
          ref={o => this.ActionSheet = o}
          options={['Remove ' + this.state.rep.firstname + ' ' + this.state.rep.lastname, 'Cancel']}
          cancelButtonIndex={1}
          destructiveButtonIndex={0}
          onPress={(index) => { 
            if (index === 0) {
              this.onDeletePressed()
            } 
          }}
          />
        }

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
    width: 40,
    height: 40,
    position: 'absolute',
    right: 8,
    bottom: 0,
    paddingBottom: 6,
    paddingLeft: 6,
    justifyContent: 'flex-end',
  },
  
  rightImage: {
    width: 28,
    height: 28,
  },

  profileView: {
    width: '100%',
    marginTop: 24,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },

  profileImageView :{
    width: 94,
    height: 94,
    borderRadius: 47,
    marginLeft: 16,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3,
    borderColor: '#fff',
  },

  statusView: {
    width: 28,
    height: 28,
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderColor: 'white',
    borderRadius: 14,
    borderWidth: 3,
    backgroundColor: 'red'    
  },

  profileContentView: {
    marginLeft: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },

  nameText: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Poppins-SemiBold',
  },

  emailText: {
    marginTop: 2,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.darkBlue,
    textDecorationLine: 'underline',
  },

  ratingView: {
    height: 22,
    marginTop: 6,
    flexDirection: 'row',
  },

  ratingText: {
    height: 22,
    marginLeft: 2,
    paddingTop: 5,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.lightGray
  },

  listView: {
    flex: 1,
    width: DEVICE_WIDTH,
    marginTop: 16,  
    alignItems: 'center',
  },

  segementContainer: {
    height: 32,
    width: DEVICE_WIDTH - 32,
    marginTop: 6,
    marginBottom: 10,
  },

  sectionView3: {
    width: DEVICE_WIDTH - 32,
    height: 30,
    backgroundColor: 'white',
  },

  todayText3: {
    marginTop: 12, 
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.sectionHeader,
  },

  vItem3: {
    width: '100%',
    marginTop: 6,
    marginBottom: 6,      
    paddingBottom: 12,                
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    justifyContent: 'flex-start',  
  },

  nameText3: {
    marginTop: 10,
    marginLeft: 12,
    fontSize: 15,    
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
  },

  reviewText3: {
    marginLeft: 12,
    marginTop: 2,
    fontSize: 14,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },

  ratingView3: {
    height: 29,
    marginTop: 12,
    marginLeft: 12,    
    flexDirection: 'row',
  },

  ratingText3: {
    height: 29,
    marginLeft: 8,
    paddingTop: 4,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-Regular',
  },

  sectionView1: {

    marginLeft: 6,
    height: 30,
    backgroundColor: 'white',
  },

  todayText1: {
    marginTop: 12, 
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.sectionHeader,
  },

  cellContentView1: {
    width: DEVICE_WIDTH - 32,
    marginLeft: 6,    
    marginTop: 6,
    marginBottom: 6,      
    paddingHorizontal: 12,
    paddingVertical: 16,                
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    justifyContent: 'flex-start', 
    flexDirection: 'row',
  },  

  timeText1: {
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
    color: theme.colors.primary
  },

  nameText1: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',  
  },

  body: {
    flex: 1,
    flexDirection: 'row',
  },

  hour_col: {
    marginLeft: 16,
    width: 50,
    flexDirection: 'column',
  },

  schedule_col: {
    marginRight: 16,
    flex: 1,
  },

  eventView: {
    width: '100%',    
    position: 'absolute',    
    flexDirection: 'row',
    justifyContent: 'space-around',
  }, 
})
