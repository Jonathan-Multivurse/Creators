import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal, 
  FlatList,
  TextInput,
  LogBox, 
  ActionSheetIOS
} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {firebase} from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import REQUEST_DB from '../../api/requestDB'

import MessagesList from './List'
import MessageInput from './MessageInput'
import { theme } from '../../core/theme'
import { showError } from '../../NotificationService'

import { dialogLeave } from '../../actionCreators'
import NavigationService from '../../NavigationService'

// taken from https://github.com/ptelad/react-native-iphone-x-helper/blob/master/index.js
const isIphoneX = () => {
  const { height, width } = Dimensions.get('window')
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    ((height === 812 || width === 812) || (height === 844 || width === 844) || (height === 896 || width === 896) || (height === 926 || width === 926))
  )
}

const keyboardViewProps = Platform.select({
  ios: {
    behavior: 'padding',
    keyboardVerticalOffset: isIphoneX() ? 20 : 0
  }
})

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

class Messages extends Component {
  constructor(props) {
    super(props) 
    this._observer = null;

    this.state = {
      isLoading: false,
      request: global.selectedRequest,
      
      colleagueModal: false,
      isRequesting: false,
      selectedCategory: 0,
      currentAllIndex: -1,
      currentIdleIndex: -1,
      cUsers:[],
      idleUsers: [],
      cFUsers:[],
      idleFUsers: [],

      askingModal: false,
      isAsking: false,
      messageToAdmin: '',
    }
  }

  // static navigationOptions = ({route, navigation }) => {
  //   const dialog = route.params.dialog
  //   const leaveDialog = route.params.leaveDialog

  //   const circleText = dialog.name
  //     .split(',')
  //     .filter((str, i) => i < 2 ? str : undefined)
  //     .reduce((res, val) => res + val.trim().charAt(0).toUpperCase(), '')
  //   return {
  //     headerTitle: (
  //       <View style={styles.titleView}>
  //         {dialog.photo ? (
  //           <Image
  //             resizeMode="center"
  //             source={{ uri: dialog.photo }}
  //             style={styles.dialogCircle}
  //             borderRadius={80}
  //           />
  //         ) : (
  //           <View style={[styles.dialogCircle, { backgroundColor: dialog.color }]}>
  //             <Text style={styles.titleText}>{circleText}</Text>
  //           </View>
  //         )}
  //         <Text numberOfLines={1} style={styles.titleText}>
  //           {dialog.name}
  //         </Text>
  //       </View>
  //     ),
  //     headerRight: dialog.type === QB.chat.DIALOG_TYPE.PUBLIC_CHAT ? (
  //       <View style={{ width: 55 }} />
  //     ) : (
  //       <MoreMenu
  //         dialogType={dialog.type}
  //         onInfoPress={() => navigation.navigate('DialogInfo', { dialog })}
  //         onLeavePress={leaveDialog}
  //       />
  //     )
  //   }
  // }

  componentDidMount() {

    LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
    this.getCompanyReps();

    this._observer = firestore().collection('request').doc(global.selectedRequest.requestid)
    .onSnapshot({
      error: (e) => console.error(e),
      next: (documentSnapshot) => {
        if ( documentSnapshot.data() !== undefined ) {
          const updatedData = documentSnapshot.data()
          global.selectedRequest = updatedData
          this.setState({request: updatedData})
        }        
      }
    })
  }

  componentWillUnmount() {
    this._observer();
  }

  // shouldComponentUpdate(nextProps) {
  //   const { dialog } = this.props
  //   // if (dialog && nextProps.dialog) {
  //   //   if (!this.dialogsEqual(dialog, nextProps.dialog)) {
  //   //     nextProps.navigation.setParams({ dialog: nextProps.dialog })
  //   //     return true
  //   //   }
  //   // }
  //   return false
  // }

  dialogsEqual = (dialog1, dialog2) => {
    if ((dialog1 && !dialog2) || (!dialog1 && dialog2)) {
      return false
    }
    const idsEqual = dialog1.id === dialog2.id
    let occupantsEqual = true
    if (dialog1.occupantsIds && dialog2.occupantsIds) {
      if (dialog1.occupantsIds.length === dialog2.occupantsIds.length) {
        occupantsEqual = dialog1.occupantsIds.every(userId =>
          dialog2.occupantsIds.indexOf(userId) > -1
        )
      } else {
        occupantsEqual = false
      }
    }
    const nameEqual = dialog1.name === dialog2.name
    const lastMessageEqual = dialog1.lastMessage === dialog2.lastMessage
    return idsEqual && nameEqual && lastMessageEqual && occupantsEqual
  }

  leaveDialog = () => {
    const { dialog, navigation, leaveDialog } = this.props
    console.log("dialog ----->", dialog);
    new Promise((resolve, reject) => {
      leaveDialog({ dialogId: dialog.id, resolve, reject })
    })
    .then(() => { 
      this._observer();
      NavigationService.navigate('Dashboard', {})

      const userID = firebase.auth().currentUser.uid;

      if (userID === global.selectedRequest.receiverId) {
        REQUEST_DB.completeRequest(global.selectedRequest.requestid, this.onComplete)
      }
   })
    .catch(action => showError('Failed to leave dialog', action.error))
  }

  onComplete = async () => {
  }

  showActionSheet = () => {    

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Add your colleague', 'Ask Admin to assign', 'End Request', 'Cancel'],
          cancelButtonIndex: 3,
          userInterfaceStyle: 'light'
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            this.addColleague(true);
          } else if (buttonIndex === 1) {
            this.askAdmin(true)
          } else if (buttonIndex === 2) {
            this.leaveDialog()
          }
        }
      );
    } else {
      this.ActionSheet.show()
    }   
  }

  addColleague = (visible) => {
    this.setState({
      colleagueModal: visible, 
      currentAllIndex: -1,
      currentIdleIndex: -1
    });
  }

  getCompanyReps = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

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
          alert("GetReps Error");
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

  selectRepRow = (index) => {
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

  colleagueRequest = () => {
    if (!this.state.isRequesting) {
      if ( ((this.state.selectedCategory == 0) && (this.state.currentAllIndex > -1)) || ((this.state.selectedCategory == 1) && (this.state.currentIdleIndex > -1))) {

        this.setState({
          isRequesting: true
        })
  
        const requestID = this.state.request.requestid
        const senderID = this.state.request.sender.userid
        const senderNAME = this.state.request.sender.firstname + " " + this.state.request.sender.lastname
        const userID = firebase.auth().currentUser.uid;
        const secondReceiver = (this.state.selectedCategory == 0) ? this.state.cFUsers[this.state.currentAllIndex]: this.state.idleFUsers[this.state.currentIdleIndex]
        const secondReceiverID = secondReceiver.userid
        const secondReceiverNAME = secondReceiver.firstname + " " + secondReceiver.lastname        
  
        fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/colleagueRequest', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestid: requestID,
            senderid: senderID,
            sendername: senderNAME,  
            receiverid: userID, 
            secondReceiverid: secondReceiverID,   
            secondReceivername: secondReceiverNAME               
          }),
        })
        .then((response) => response.json())
        .then((responseJson) => {
          this.setState({
            isRequesting: false
          }) 
  
          if (responseJson.statusCode !== 200) {
            // alert(responseJson.error);
            return;
          } else {
            this.addColleague(false);
          }         
        })
        .catch((err) => {        
          this.setState({
            isLoading: false,
            isRequesting: false,
            colleagueModal: false,
          });
          Alert.alert('Network Error', 'Please check your network connection and try again.')
        });
      }
    }
  }

  askAdmin = (visible) => {
    this.setState({askingModal: visible, messageToAdmin: ''});
  }

  onNotifyAdmin = () => {
    if (!this.state.isAsking) {
      if ( this.state.messageToAdmin == '') {
        Alert.alert(
          "Error",
          `You should type message to admin.`,
          [
            {
              text: "Ok",
            },
          ],
          { cancelable: false }
        );
        return;
      } else {
        this.setState({
          isAsking: true
        })

        const requestID = this.state.request.requestid        
        const senderID = this.state.request.sender.userid
        const senderNAME = this.state.request.sender.firstname + " " + this.state.request.sender.lastname
        const userID = firebase.auth().currentUser.uid;
        const messageAdmin = this.state.messageToAdmin
  
        fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/askingAdmin', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestid: requestID,
            senderid: senderID,
            sendername: senderNAME, 
            receiverid: userID,  
            messagetoadmin: messageAdmin,                     
          }),
        })
        .then((response) => response.json())
        .then((responseJson) => {
          this.setState({
            isAsking: false
          }) 
  
          if (responseJson.statusCode !== 200) {
            // alert(responseJson.error);
            return;
          } else {
            this.askAdmin(false);
          }         
        })
        .catch((err) => {        
          this.setState({
            isLoading: false,
            isAsking: false,
            askingModal: false,
          });
          Alert.alert('Network Error', 'Please check your network connection and try again.')
        });
      }
    } 
  }

  leaveDialogWithout = () => {
    this._observer();
    NavigationService.navigate('Dashboard', {})
  }

  render() {
    const { dialog, navigation } = this.props
    const { id } = dialog ? dialog : this.props.route.params.dialog
    return (
      <KeyboardAvoidingView
        {...keyboardViewProps}
        style={{ flex: 1, backgroundColor: 'white' }}
      >

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.colleagueModal}
          onRequestClose={() => {
            this.addColleague(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {styles.modalView}>

              <View style={styles.titleViewModal}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}>Add Colleague</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity style={styles.closeView} onPress={() => this.addColleague(false)} >
                  <Image  style={styles.coloseImage} source={require('../../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>    

              <View style={styles.listView}>

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
                      <TouchableOpacity onPress={() => this.selectRepRow(index)} style={styles.cellContentView1}>
                        <View style={styles.profileImageView1}>
                          <Image source={{uri: item.image}} style={styles.profileImage} />
                        </View>

                        <View style={styles.contentView}>
                          <Text style={styles.nameText1}>{item.firstname + " " + item.lastname}</Text>
                          <View style={{flex: 1}}/>
                          { (this.state.selectedCategory == 0 && this.state.currentAllIndex == index) || (this.state.selectedCategory == 1 && this.state.currentIdleIndex == index) ? 
                            (<Image source={require('../../assets/images/home/icon_option.png')} style={styles.iconImage}/>)
                            : (<View style={styles.iconView} />)
                          } 
                        </View>
                      </TouchableOpacity>
                    </View>
                  }
                />

                <View style={styles.bottomView}>
                  { (this.state.selectedCategory == 0 && this.state.currentAllIndex > -1) || (this.state.selectedCategory == 1 && this.state.currentIdleIndex > -1) ? 
                    <View style = {styles.vItem1}>
                      <View style = {{...styles.vContent, backgroundColor: '#EF8F3533'}}>
                        <View style={styles.vImageView}>    
                          <Image source={require('../../assets/images/home/iconChat.png')} style={styles.vImage} />
                        </View>
                        <Text style={styles.vText}>{this.state.request.sender.firstname + " " + this.state.request.sender.lastname}</Text>
                        <View style={{flex: 1}} />
                      </View>
                      <View style={{flex: 1}} />
                      <View style={styles.receiverProfileView}>
                        {
                          this.state.selectedCategory == 0 ? 
                          <Image source={{uri : this.state.cFUsers[this.state.currentAllIndex].image}} style={styles.receiverImage} />
                          : <Image source={{uri : this.state.idleFUsers[this.state.currentIdleIndex].image}} style={styles.receiverImage} />
                        }                              
                      </View> 
                    </View>
                  : <View style = {{...styles.vItem, backgroundColor: '#EF8F3533'}}>
                        <View style={styles.vImageView}>
                          <Image source={require('../../assets/images/home/iconChat.png')} style={styles.vImage} />
                        </View>                  
                        <Text style={styles.vText}>{this.state.request.sender.firstname + " " + this.state.request.sender.lastname}</Text>
                    </View>          
                  }
        
                  <TouchableOpacity onPress={() => this.colleagueRequest()} style={(this.state.selectedCategory == 0 && this.state.currentAllIndex > -1) || (this.state.selectedCategory == 1 && this.state.currentIdleIndex > -1) ? styles.assignButtonAvailable : styles.assignButton} >
                    <Text style={{...styles.assignText, color: (this.state.selectedCategory == 0 && this.state.currentAllIndex > -1) || (this.state.selectedCategory == 1 && this.state.currentIdleIndex > -1) ? 'white' : theme.colors.darkGray}}>Request</Text>
                  </TouchableOpacity> 

                </View>
              </View> 
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.askingModal}
          onRequestClose={() => {
            this.askAdmin(false);
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {styles.modalView1}>

              <View style={styles.titleViewModal}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}>Ask Admin to assgin</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity style={styles.closeView} onPress={() => this.askAdmin(false)} >
                  <Image  style={styles.coloseImage} source={require('../../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={{...styles.selectText, marginTop: 18,}}>Support</Text>
              <View style={{...styles.cellSelectedContentView, width: DEVICE_WIDTH/3, alignSelf: 'flex-start', marginLeft: 16,}}>
                <Image source={ require('../../assets/images/home/iconChat.png')} style={styles.vImage} />
                <Text style={styles.vText}>Chat</Text>
              </View>                        

              <Text style={{...styles.selectText, marginTop: 12}}>Simulator</Text>
              <View style = {{...styles.cellSelectedContentView, marginLeft: 16, alignSelf: 'flex-start'}}>                     
                <Text style={{...styles.vText, marginLeft: 16, marginRight: 16, }}>{this.state.request.simulator}</Text>
              </View>

              <View style={{flexDirection: 'row'}}>
                <Text style={{...styles.selectText, marginTop: 12}}>Add a message to Admin</Text>
                <View style={{flex:1}}/>
                <Text style={styles.countText}>{this.state.messageToAdmin.length}/100</Text> 
              </View>

              <TextInput
                style={styles.emailInput}
                blurOnSubmit={true}
                placeholder="Type a message"
                multiline={true}
                value={this.state.messageToAdmin}
                onChangeText={(text) => this.setState({messageToAdmin: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
              /> 

              <TouchableOpacity style={styles.loginButton} onPress={() => this.onNotifyAdmin()}>
                <Text style={styles.loginText}>Notify Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        <SafeAreaView
          forceInset={{ top: 'always', bottom: 'always' }}
          style={styles.safeArea}
        >
          <View style = {styles.navigationView}>
            <TouchableOpacity style={styles.backButton} onPress={this.leaveDialogWithout} >
              <Image
                style={styles.backImage}
                source={require('../../assets/images/login/arrow_back.png')}
              />
            </TouchableOpacity>

            <Text style={styles.nameText}>{ global.selectedRequest ?  global.selectedRequest.sender.firstname + " "  +  global.selectedRequest.sender.lastname : "Support Chat" }</Text>
            <View style={{flex: 1}}/>
            <TouchableOpacity style={styles.rightButton} onPress={this.showActionSheet} >
              <Image
                style={styles.rightImage}
                source={require('../../assets/images/message/Dot_blue.png')}
              />
            </TouchableOpacity>
          </View>
          <MessagesList dialogId={id} />
          <MessageInput dialogId={id} />

        { Platform.OS === 'android' && 
          <ActionSheet
            ref={o => this.ActionSheet = o}
            options= {['Add your colleague', 'Ask Admin to assign', 'End Request', 'Cancel']}
            cancelButtonIndex={3}
            destructiveButtonIndex={3}
            onPress={(index) => {   
              if (index == 0) {
                this.addColleague(true);
              } else if (index == 1){
                this.askAdmin(true)
              } else if (index == 2){
                this.leaveDialog()
              }                      
            }}
          />
        }

        </SafeAreaView>

        {this.state.isLoading ? (
            <ActivityIndicator
            color={theme.colors.primary}
            size="large"
            style={styles.preloader}
            />
        ) : null}
      </KeyboardAvoidingView>
    )
  }
}

const styles = StyleSheet.create({
  navigationView: {
    width: '100%',
    height: 73,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    backgroundColor: 'white',

    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8, 
  },  

  preloader: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },

  backButton: {
    width: 50,
    height: 50,
    marginLeft: 0,
    marginBottom: 13,
    paddingBottom: 8,
    paddingLeft: 16,
    justifyContent: 'flex-end',
  },

  nameText: {
    marginLeft: 8,
    marginBottom: 17,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',  
    fontWeight: '600'
  },

  rightButton: {
    width: 40,
    height: 40,
    marginRight: 8,
    marginBottom: 8,
    paddingBottom: 6,
    paddingLeft: 6,
    justifyContent: 'flex-end',
  },
  
  rightImage: {
    width: 28,
    height: 28,
  },

  titleView: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 25,
  },

  titleText: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 20,
    fontSize: 16,
    fontWeight: 'normal',
  },

  dialogCircle: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginRight: 10,
    width: 28,
  },

  safeArea: {
    backgroundColor: 'white',
    flex: 1,
    width: '100%',
  },

  titleSmallText: {
    color: theme.colors.white,
    fontSize: 13,
    lineHeight: 15,
    opacity: 0.6,
  },

  headerButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  headerButtonText: {
    color: theme.colors.white,
    fontSize: 17,
    lineHeight: 20,
  },

  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: theme.colors.shadow
  },

  modalView: {    
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT- 100,
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

  modalView1: {    
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

  titleViewModal : {    
    flexDirection: 'row',
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  closeView: {
     position: 'absolute',
     right: 10,
     top: 10,
     height: 50,
     width: 50,
  },

  coloseImage: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 44,
    height: 44,
  },

  listView: {
    flex: 1,
    width: DEVICE_WIDTH,  
    alignItems: 'center',
  },

  searchView: {
    width: DEVICE_WIDTH - 32,
    height: 45,    

    marginTop: 16,
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

  segementContainer: {
    height: 32,
    width: DEVICE_WIDTH - 32,
    marginTop: 12,
    marginBottom: 10,
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

  nameText1: {
    fontSize: 16,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    marginTop: 10,
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

  iconImage: {
    marginTop: 10,
    marginRight: 8,
    width: 20,
    height: 20,
    alignSelf: 'center'
  },

  bottomView: {
    width: DEVICE_WIDTH, 
    height: 180,
    marginBottom: 0,
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

  selectText: {
    marginTop: 24,
    paddingLeft: 16,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  cellSelectedContentView: {
    height: 42,
    marginHorizontal: 4,
    marginVertical: 8,
    paddingTop: 2,
    borderRadius: 21,           
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    flexDirection: 'row',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
  },

  emailInput: {
    width: DEVICE_WIDTH - 24,    
    height: 90,
    marginLeft: 0,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  countText:{
    marginTop: 12,
    marginRight: 16,
    paddingLeft: 16,
    fontSize: 18,
    lineHeight: 26,
    
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 24,
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
})

const mapStateToProps = ({ dialogs: { dialogs = [] } }, {route, navigation }) => {
  const navParamDialog =  route.params.dialog
  const dialog = navParamDialog ?
    dialogs.find(d => d.id === navParamDialog.id) :
    undefined
  return { dialog }
}

const mapDispatchToProps = { leaveDialog: dialogLeave }

export default connect(mapStateToProps, mapDispatchToProps)(Messages)