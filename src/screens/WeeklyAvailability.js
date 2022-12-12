import React, { Component } from 'react'
import { StyleSheet, Platform, View, TouchableOpacity, Text, FlatList, Dimensions, ActivityIndicator, Image, Modal, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import USER_DB from '../api/userDB'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

availableDays = ['Everyday', 'Mon - Fri', 'Sat - Sun', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

getAvailableTime = (hour) =>{
  var defTime = '';
  if (hour == 0) {
    defTime = "12 AM";
  } else if (hour < 12 ){
    defTime = hour + " AM";
  } else if(hour == 12) {
    defTime = "12 PM";
  } else {
    defTime = (hour - 12) + " PM";
  } 

  return defTime;
}

export default class WeeklyAvailability extends Component {
  constructor(props) {
    super(props);   
    USER_DB.getProfile(this.onUserGet)

    this.state = { 
      isLoading: false,
      weeklyAvailable: [],

      modalVisibleDays: false,
      selectedIndex : 0,
      tmpDaysIndex: 0,

      isPickerShow: false, 
      pickerIndex: true,
      pickerTime: '',
    }
  }

  onUserGet = (user) => {
    var tmpAvailable = []
    if (user.weeklyAvailable){
      tmpAvailable = user.weeklyAvailable
    } 

    this.setState({
      isLoading: false,      
      weeklyAvailable: tmpAvailable,      
    })
  } 

  onSave = async () => {
    this.setState({
      isLoading: true
    })    

    USER_DB.updateProfile({weeklyAvailable: this.state.weeklyAvailable, updated: new Date().getTime()}, this.goNext);
  };

  goNext = async () => { 
    this.setState({
      isLoading: false
    })

    this.props.navigation.goBack()
  };

  onAddHours = async() => {
    var tmpAvailable = this.state.weeklyAvailable

    tmpAvailable.push({
      'days': 0,
      'from': 9,
      'to': 19,
    });

    this.setState({weeklyAvailable: tmpAvailable})
  }

  onDelete = (selectedIndex) => {
    var tmpAvailable = this.state.weeklyAvailable
    tmpAvailable.splice(selectedIndex, 1)

    this.setState({weeklyAvailable: tmpAvailable})    
  }

  onCloseDays = (visible) => {
    this.setState({ 
      modalVisibleDays: visible,
    });         
  }

  onEditDays = (visible, selectedIndex,) => {
    this.setState({ 
      modalVisibleDays: visible,
      selectedIndex: selectedIndex,
      tmpDaysIndex: this.state.weeklyAvailable[selectedIndex].days
    });         
  }

  onDaysDone = () => {
    var tmpWeeklyAvailable = this.state.weeklyAvailable;
    var tmpSelected = tmpWeeklyAvailable[this.state.selectedIndex]
    tmpSelected.days = this.state.tmpDaysIndex
    tmpWeeklyAvailable.splice(this.state.selectedIndex, 1)
    tmpWeeklyAvailable.splice(this.state.selectedIndex, 0, tmpSelected)

    this.setState({
      weeklyAvailable: tmpWeeklyAvailable,
      modalVisibleDays: false
    })
  }

  onPickerPressed = (pickerIndex, selectedIndex) => {
    var tmpSelected = this.state.weeklyAvailable[selectedIndex]
    var tmpTime = 0
    if (pickerIndex){
      tmpTime = tmpSelected.from
    } else {
      tmpTime = tmpSelected.to
    }

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()
    const hour = tmpTime
    const minute = 0

    const newDate = new Date(year, month, day, hour, minute);

    this.setState({
      isPickerShow: true,
      selectedIndex: selectedIndex,
      pickerIndex: pickerIndex,
      pickerTime: newDate
    })    
  }

  onPressTime = (date) => {
    console.log(date);

    const year = this.state.pickerTime.getFullYear()
    const month = this.state.pickerTime.getMonth()
    const day = this.state.pickerTime.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()

    const newDate = new Date(year, month, day, hour, minute);

    this.setState({
      pickerTime: newDate,
    });
  }

  onPressPickerDone = () => {
    const hour = this.state.pickerTime.getHours()

    var tmpWeeklyAvailable = this.state.weeklyAvailable;
    var tmpSelected = tmpWeeklyAvailable[this.state.selectedIndex]
    
    var tmpFromTime = tmpSelected.from
    var tmpToTime = tmpSelected.to

    if (this.state.pickerIndex){
      if (hour < tmpToTime) {
        tmpSelected.from = hour
      } else {
        Alert.alert(
          "Warning",
          "Invaild time! Please try again."
        );  
        return
      }      
    } else {
      if (hour > tmpFromTime){
        tmpSelected.to = hour
      } else {
        Alert.alert(
          "Warning",
          "Invaild time! Please try again."
        );  
        return
      }      
    }
    
    tmpWeeklyAvailable.splice(this.state.selectedIndex, 1)
    tmpWeeklyAvailable.splice(this.state.selectedIndex, 0, tmpSelected)

    this.setState({
      weeklyAvailable: tmpWeeklyAvailable,
      isPickerShow: false,
    })
  }

  render() {

    return (
      <Background>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisibleDays}
          onRequestClose={() => {
            this.setState({ 
              modalVisibleDays: false}); 
          }}
        >
          <View style={styles.centeredView}>
            <View style = {styles.modalView}>
              <View style={styles.titleView}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}>Days</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity onPress={() => {
                  this.setState({ 
                    modalVisibleDays: false}); 
                }}>
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>
              <View style={styles.listView}>
                <FlatList
                data={availableDays}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (
                  <TouchableOpacity onPress={() => this.setState({tmpDaysIndex: index})} style={{...styles.cellContentView1, borderBottomColor: theme.colors.lineColor, borderBottomWidth: 1}}>
                    <Text style={styles.daysText}>{item}</Text>
                    <View style={{flex:1}}/>
                    {this.state.tmpDaysIndex == index ? <Image source={require('../assets/images/home/ChevronDown.png')} style={styles.image} /> : <View/>}
                  </TouchableOpacity> 
                )}
              />
              </View>
              <TouchableOpacity style={styles.loginButton} onPress={() => this.onDaysDone()}>
                <Text style={styles.loginText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Weekly Availability</PageTitle>
          <TouchableOpacity  style={styles.rightButton} onPress={() => this.onSave()}>
            <Text style={styles.rightText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style = {styles.contentView}>  
          <FlatList
          data={this.state.weeklyAvailable}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => (
            <View style={styles.cellView}>
              <View style={styles.cellContentView}>
                <View style={{...styles.rowView, borderBottomColor: theme.colors.lineColor}}>
                  <Text style={styles.availText}>Availability</Text>
                  <View style={{flex:1}}/>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => this.onDelete(index)} >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <View style={{...styles.rowView, borderBottomColor: theme.colors.lineColor}}>
                  <Text style={styles.daysText}>Days</Text>
                  <View style={{flex:1}}/>
                  <TouchableOpacity style={styles.arrowButton} onPress={() => this.onEditDays(true, index)} >
                    <Text style={styles.availText}>{availableDays[item.days]}</Text>
                    <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward_g.png')} />
                  </TouchableOpacity>
                </View>

                <View style={{...styles.rowView, borderBottomColor: theme.colors.lineColor}}>
                  <Text style={styles.daysText}>From time</Text>
                  <View style={{flex:1}}/>
                  <TouchableOpacity style={styles.arrowButton} onPress={() => this.onPickerPressed(true, index)}>
                    <Text style={styles.availText}>{getAvailableTime(item.from)}</Text>
                    <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward_g.png')} />
                  </TouchableOpacity>
                </View>

                <View style={{...styles.rowView, borderBottomWidth: 0}} >
                  <Text style={styles.daysText}>To</Text>
                  <View style={{flex:1}}/>
                  <TouchableOpacity style={styles.arrowButton} onPress={() => this.onPickerPressed(false, index)} >
                    <Text style={styles.availText}>{getAvailableTime(item.to)}</Text>
                    <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward_g.png')} />
                  </TouchableOpacity>
                </View>
              </View>                    
            </View>
            )}
          /> 

          <TouchableOpacity style={styles.doneButton} onPress={() => this.onAddHours()}>
            <Image style={styles.plusImage} source={require('../assets/images/survey/Plus_yellow.png')} />
            <Text style={styles.doneText}>Add hours</Text>
          </TouchableOpacity> 

          {this.state.isPickerShow ? 
            <View style={styles.pickerView}>
              <TouchableOpacity style={styles.pickerHeader} onPress={this.onPressPickerDone}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
              <View style={styles.timePickerView}>
                <DateTimePicker
                  value={this.state.pickerTime}
                  mode={'time'}
                  is24Hour={false}
                  display="spinner"
                  onChange={(event, date) => this.onPressTime(date)}
                  minuteInterval={30}
                  themeVariant="light"
                />
              </View>                     
            </View> 
          : <View /> 
          }        
        </View>

        {this.state.isLoading ? 
          (<ActivityIndicator
            color={theme.colors.primary}
            size="large"
            style={styles.preloader}
            />
          ) : null
        }
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
    height: 50,
    position: 'absolute',    
    bottom: 0,
    right: 0,
    paddingBottom: 8,
    paddingRight: 20,
    justifyContent: 'flex-end',
  },

  rightText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: theme.colors.calendarSelected
  },

  contentView: {
    width: DEVICE_WIDTH,
    flex: 1,
    marginTop: 12,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  cellView: {
    width: DEVICE_WIDTH,
    height: 188,
  },

  cellContentView: {
    flex: 1,
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
  },

  rowView: {
    marginLeft: 10,
    marginRight: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',    
    borderBottomWidth: 1,
  },

  availText: {      
    fontSize: 14,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },

  deleteButton: {
    height: 42,
    justifyContent: 'center',
  },

  deleteText: {
    fontSize: 14,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.mainRed
  },

  daysText: {   
    alignSelf: 'center',   
    fontSize: 14,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },

  arrowButton: {
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  arrowImage: {
    marginLeft: 8,
    width: 10,
    height: 16,
  },

  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 0,
    backgroundColor: theme.colors.shadow
  },

  modalView: {    
    width: DEVICE_WIDTH,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: "center",   
    backgroundColor: "white", 

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },

  titleView : {    
    flexDirection: 'row',
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 26,
    fontFamily: 'Poppins-Medium',
  },

  coloseImage: {
    position: 'absolute',
    top: 14,
    right: 9,
    width: 44,
    height: 44,
  },  

  listView: {
    width: DEVICE_WIDTH,
    borderTopColor: theme.colors.lineColor,
    borderTopWidth: 1
  },

  cellContentView1: {
    height: 44,
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    justifyContent: 'center',
    flexDirection: 'row',
  },

  image: {
    height: 8.33,
    width: 14.23,    
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 43,
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
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },

  pickerView: {
    position: 'absolute',
    bottom: 0,
    width: DEVICE_WIDTH, 
    backgroundColor: 'white',
  },

  pickerHeader: {
    width: '100%',
    height: 44,
    backgroundColor: theme.colors.navBar,
    borderRadius: 3,
  },

  pickerDone: {
    position: 'absolute',
    right: 12,
    top: 14,
    color: theme.colors.primary
  }, 
  
  timePickerView: {
    width: '100%',
  },    

  doneButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 8,
    marginBottom: 63,
    borderRadius: 28.5,
    backgroundColor: theme.colors.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  doneText: {
    marginLeft: 12,
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },

  plusImage: {
    width: 20,
    height: 20,
    tintColor: 'white'
  },
})