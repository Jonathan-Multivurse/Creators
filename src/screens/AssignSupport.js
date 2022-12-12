import React, { Component } from 'react'
import { View, StyleSheet, Platform, Image, Dimensions, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { theme } from '../core/theme'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import USER_DB from '../api/userDB'
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth'
import { color } from 'react-native-reanimated';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class AssignSupport extends Component {
  constructor(props) {
    super(props)

    this._unsubscribeFocus = null;

    this.state = { 
      request: this.props.route.params.request,
      isFrom: this.props.route.params.isFromHomePage,

      isLoading: false,
      isSearch: false,
      searchText: '',
      isAssigning: false,

      selectedCategory: 0,
      currentAllIndex: -1,
      currentIdleIndex: -1,
      
      cUsers:[],
      idleUsers: [],

      cFUsers:[],
      idleFUsers: [],
    }
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getSupports();
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
  }

  getSupports = () => {
    const adminID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    if (this.state.isFrom) {
      fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getCompanyReps', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: adminID,
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
          cUsers: responseJson.reps,
          idleUsers: responseJson.ideals,

          cFUsers: responseJson.reps,
          idleFUsers: responseJson.ideals,
        });     
      })
      .catch((err) => {        
        this.setState({
          isLoading: false,
        });
        Alert.alert('Network Error', 'Please check your network connection and try again.')
      });
    } else {
      const userID = this.state.request.receiverId;

      fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getReps', {
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
          cUsers: responseJson.reps,
          idleUsers: responseJson.ideals,

          cFUsers: responseJson.reps,
          idleFUsers: responseJson.ideals,
        });     
      })
      .catch((err) => {        
        this.setState({
          isLoading: false,
        });
        Alert.alert('Network Error', 'Please check your network connection and try again.')
      });
    }       
  }

  searchFilter = (text) => {
    this.setState({searchText: text})
    if (text) {  
      const newComData = this.state.cUsers.filter(
        function(item){
          const itemData = (item.firstname + " " + item.lastname).toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
        }
      )
      this.setState({
        cFUsers: newComData,
      })

      const newIdleData = this.state.idleUsers.filter(
        function(item){
          const itemData = (item.firstname + " " + item.lastname).toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
        }
      )
      this.setState({
        idleFUsers: newIdleData,
      })      
    } else {
      if (this.state.selectedCategory == 0 ) {
        this.setState({
          cFUsers: this.state.cUsers,
        })
      } else {
        this.setState({
          idleFUsers: this.state.idleUsers,
        })
      }      
    }
  }

  setSearchCancel= () => {
    this.setState({
      searchText: '',
      isSearch: false,
      cFUsers: this.state.cUsers,
      idleFUsers: this.state.idleUsers,
      currentAllIndex: -1,
      currentIdleIndex: -1,
    })
  }

  setSearch= () => {
    this.setState({
      searchText: '',
      isSearch: true,
      cFUsers: this.state.cUsers,
      idleFUsers: this.state.idleUsers,
      currentAllIndex: -1,
      currentIdleIndex: -1,
    })
  }

  selectRow = (index) => {
    if (this.state.selectedCategory == 0) {
      if (this.state.currentAllIndex == index) {
        this.setState({currentAllIndex: -1});
      } else {
        this.setState({currentAllIndex: index});
      } 
    } else {
      if (this.state.currentIdleIndex == index) {
        this.setState({currentIdleIndex: -1});
      } else {
        this.setState({currentIdleIndex: index});
      } 
    }       
  }

  assignSupport = () => {

    if (!this.state.isAssigning) {
      if ( (this.state.selectedCategory == 0 && this.state.currentAllIndex > -1) || (this.state.selectedCategory == 1 && this.state.currentIdleIndex > -1) ) {

        this.setState({
          isLoading: true,
          isAssigning: true
        })

        const requestID = this.state.request.requestid
        const senderID = this.state.request.sender.userid
        const senderNAME = this.state.request.sender.firstname + " " + this.state.request.sender.lastname        
        const receiver = this.state.selectedCategory == 0 ? this.state.cFUsers[this.state.currentAllIndex]: this.state.idleFUsers[this.state.currentIdleIndex]
        const receiverID = receiver.userid
        const adminID = firebase.auth().currentUser.uid;
        const notificationID = this.state.isFrom ? '' : this.props.route.params.notificationID
        const isSchedule = this.state.request.isSchedule

        var uri = '' 
        if (this.state.isFrom) {
          uri = 'https://us-central1-melisa-app-81da5.cloudfunctions.net/assignSupport'
        } else {
          uri = 'https://us-central1-melisa-app-81da5.cloudfunctions.net/assignColleagueSupport'
        }
  
        fetch(uri, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestid: requestID,
            senderid: senderID,
            sendername: senderNAME,            
            receiverid: receiverID,
            adminid: adminID,    
            notificationid: notificationID,
            isschedule: isSchedule    
          }),
        })
        .then((response) => response.json())
        .then((responseJson) => {
          this.setState({
            isLoading: false,
            isAssigning: false
          }) 

          if (responseJson.statusCode !== 200) {
            alert("Assign Colleague Error!");
            return;
          }          
  
          this.props.navigation.goBack()     
        })
        .catch((err) => {        
          this.setState({
            isLoading: false,
            isAssigning: false,
          });
          Alert.alert('Network Error', 'Please check your network connection and try again.')
        });
      }
    }
  }

  render() {
    return (
      <Background>

        {this.state.isSearch ? 
          <View style = {styles.navigationView1}>      
            <View style={styles.searchView}>              
              <TextInput
                style= {styles.searchInput}
                returnKeyType="search"
                value={this.state.searchText}
                onChangeText={(text) => this.searchFilter(text)}
                underlineColorAndroid="transparent"
                placeholder="Search"
              />
            </View>      
            <View style={{flex: 1}} />
            <TouchableOpacity onPress={() => this.setSearchCancel()} >
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        : <View style = {styles.navigationView}>  
            <BackButton goBack={() => this.props.navigation.goBack()} />
            <PageTitle>Assign Support</PageTitle>

            <View style={{flex: 1}} />
            <TouchableOpacity style={styles.rightButton} onPress={() => this.setSearch()}>
                <Image
                style={styles.searchImage}
                source={require('../assets/images/support/search_blue.png')}
                />
            </TouchableOpacity>
          </View>
        }

        <View style={styles.listView}>
          <SegmentedControl
            style={styles.segementContainer}
            values={[
              'All',
              'Ideals only',
            ]}
            selectedIndex={this.state.selectedCategory}
            onChange={(event) => {
              this.setState({selectedCategory: event.nativeEvent.selectedSegmentIndex});
            }}
            fontStyle={{fontSize: 14, fontFamily: 'Poppins-SemiBold'}}
          />
         
          <FlatList
            data={this.state.selectedCategory == 0 ?  this.state.cFUsers : this.state.idleFUsers}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => 
              <View style={styles.cellView1}>
                <TouchableOpacity onPress={() => this.selectRow(index)} style={styles.cellContentView1}>

                  <View style={styles.profileImageView1}>
                    <Image source={{uri: item.image}} style={styles.profileImage} />
                  </View>

                  <View style={styles.contentView}>
                    <Text style={styles.nameText}>{item.firstname + " " + item.lastname}</Text>
                    <View style={{flex: 1}}/>
                    { (this.state.selectedCategory == 0 && this.state.currentAllIndex == index) || (this.state.selectedCategory == 1 && this.state.currentIdleIndex == index) ? 
                      (<Image source={require('../assets/images/home/icon_option.png')} style={styles.iconImage}/>)
                      : (<View style={styles.iconView} />)
                    } 
                  </View>
                </TouchableOpacity>
              </View>
            }
          />  
        </View> 

        <View style={styles.bottomView}>
          { (this.state.selectedCategory == 0 && this.state.currentAllIndex > -1) || (this.state.selectedCategory == 1) && (this.state.currentIdleIndex > -1) ? 
            <View style = {styles.vItem1}>
              <View style = {{...styles.vContent, backgroundColor: this.state.request.isSchedule ? '#CF3E6F33' : '#EF8F3533' }}>
                <View style={styles.vImageView}>    
                 { this.state.request.isSchedule ?  
                  <Image source={require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                  : <Image source={require('../assets/images/home/iconChat.png')} style={styles.vImage} />
                 }
                </View>
                <Text style={styles.vText}>{this.state.request.sender.firstname + " " + this.state.request.sender.lastname}</Text>
                <View style={{flex: 1}} />
              </View>
              <View style={{flex: 1}} />
              <View style={styles.receiverProfileView}>
                <Image source={{uri : this.state.cFUsers[this.state.currentAllIndex].image}} style={styles.receiverImage} />    
              </View> 
            </View> 
          : <View style = {{...styles.vItem,  backgroundColor: this.state.request.isSchedule ? '#CF3E6F33' : '#EF8F3533' }}>
              <View style={styles.vImageView}>
                { this.state.request.isSchedule ?  
                  <Image source={require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                  : <Image source={require('../assets/images/home/iconChat.png')} style={styles.vImage} />
                }
              </View>                  
              <Text style={styles.vText}>{this.state.request.sender.firstname + " " + this.state.request.sender.lastname}</Text>
            </View>          
          }
          
          <TouchableOpacity onPress={() => this.assignSupport()} style={(this.state.selectedCategory == 0 && this.state.currentAllIndex > -1) || (this.state.selectedCategory == 1 && this.state.currentIdleIndex > -1) ? styles.assignButtonAvailable : styles.assignButton} >
            <Text style={{...styles.assignText, color: (this.state.selectedCategory == 0 && this.state.currentAllIndex > -1) || (this.state.selectedCategory == 1 && this.state.currentIdleIndex > -1) ? 'white' : theme.colors.darkGray}}>Assign</Text>
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

  navigationView1: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },

  pageTitle: {
    height: 28,
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',        
  },

  rightButton: {
      position: 'absolute',
      right: 0,
      bottom: 0,
    width: 50,
    height: 50,
    paddingLeft: 14,
    paddingTop: 22,
  },

  searchImage: {
    width: 16,
    height: 16,
  },

  listView: {
    height: Platform.OS === 'ios' ? DEVICE_HEIGHT - 249 - getStatusBarHeight() : DEVICE_HEIGHT - 255,
    width: DEVICE_WIDTH,
    marginTop: 9,  
    alignItems: 'center'
  },

  segementContainer: {
    height: 32,
    width: DEVICE_WIDTH - 32,
    marginTop: 6,
    marginBottom: 10,
  },

  cellView: {
    width: DEVICE_WIDTH,
    height: 116,
  },

  cellContentView: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  profileImageView: {    
    width: 46,
    height: 46,
    marginLeft: 12,
    marginTop: 12,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignContent: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  cellView1: {
    width: DEVICE_WIDTH,
    height: 76,
  },

  cellContentView1: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  profileImageView1: {    
    width: 46,
    height: 46,
    marginLeft: 12,    
    borderRadius: 23,
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  }, 

  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#fff',
  },

  contentView: {
    flex: 1,
    margin: 12,
    alignContent: 'center',
    flexDirection: 'row'
  },

  nameText: {
    fontSize: 16,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    marginTop: 10,
  },

  timeText1: {
    marginLeft: 6,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray, 
  },

  timeText: {
    marginLeft: 2,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray, 
  },

  emailText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray, 
  },

  cellButton: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium', 
    color: 'white', 
  },

  iconImage: {
    marginTop: 10,
    marginRight: 8,
    width: 20,
    height: 20,
    alignSelf: 'center'
  },

  searchView: {
    width: DEVICE_WIDTH - 104,
    height: 45,    
    marginLeft: 14,
    borderRadius: 22.5,    
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  searchInput:{
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },

  cancelText: {
    height: 45,
    marginRight: 16,
    paddingTop: 12,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',   
    color: theme.colors.darkBlue,
  },

  iconView: {
    marginTop: 10,
    marginRight: 8,
    width: 20,
    height: 20,
    borderColor: theme.colors.darkBlue,
    borderWidth: 1,
    borderRadius: 10,
  },

  bottomView: {
    position: 'absolute', 
    width: DEVICE_WIDTH, 
    height: 180,
    bottom: 0, 
    left: 0,
    backgroundColor: theme.colors.inputBar,

    shadowColor: theme.colors.shadow,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
  },

  vItem: {
    width: DEVICE_WIDTH - 32,
    height: 54,
    marginTop: 16,
    marginBottom: 14, 
    marginLeft: 16,
    marginRight: 16,                     
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },

  vImageView: {
    marginLeft: 17,
    width: 31,
    height: 31,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  vImage: {
    width: 31,
    height: 31,
  },

  vText: {
    marginLeft: 12,
    fontSize: 18,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  pendingText: {
    marginRight: 12,
    fontSize: 14,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.lightGray
  },

  assignButton: {
    width: DEVICE_WIDTH - 32,
    height: 54,
    marginLeft: 16,
    marginRight: 16,                     
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', 
    backgroundColor: theme.colors.inputBorder,
  }, 

  assignButtonAvailable: {
    width: DEVICE_WIDTH - 32,
    height: 54,
    marginLeft: 16,
    marginRight: 16,                     
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', 
    backgroundColor: theme.colors.darkBlue,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,

  }, 
  
  assignText: {
    fontSize: 16,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',    
  },

  vItem1: {
    width: '100%',
    height: 54,
    marginTop: 16,
    marginBottom: 14, 
                         
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },

  vContent: {
    width: DEVICE_WIDTH - 105,
    height: 54,
    borderRadius: 14,
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },

  receiverProfileView: {
    width: 54,
    height: 54,    
    marginRight: 16,
    borderRadius: 27,
    
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  receiverImage: {
    width: 54,
    height: 54,    
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#fff',    
    alignSelf: 'center',   
  },
})