import React, { Component } from 'react'
import { View, StyleSheet, Image, Dimensions, Text, FlatList, Modal, Alert, KeyboardAvoidingView, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import FACILITY_DB from '../api/facilityDB'
import { emailValidator } from '../helpers/emailValidator'
import firestore from '@react-native-firebase/firestore'
import { Swipeable } from 'react-native-gesture-handler'
import OTPSender from '../api/api'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class FacilityCodeShare extends Component {
  constructor(props) {
    super(props)
    this._observer = null;
    this.state = { 
      isLoading: false,          
      facility: this.props.route.params.facility,  
      filteredData: [],      
      
      modalVisible: false, 
      isAddMore: false,
      firstName: '',
      secondName: '',
      selectedItem: null,
    }
  }

  componentDidMount() {
    if (this.props.route.params.facility.sharedEmails) {
      this.setState({
        filteredData: this.props.route.params.facility.sharedEmails
      })
    } else {
      this.setState({
        filteredData: []
      })
    }   

    this._observer = firestore().collection('facility').doc(this.props.route.params.facility.facilityid)
    .onSnapshot({
      error: (e) => console.error(e),
      next: (documentSnapshot) => {
        if ( documentSnapshot.data() !== undefined ) {
          const updatedData = documentSnapshot.data()
          this.setState({
            isLoading: false,
            facility: updatedData,
          })

          if (updatedData.sharedEmails) {
            this.setState({
              filteredData: updatedData.sharedEmails
            })
          }
        }        
      }
    })
  }

  componentWillUnmount() {    
    this._observer();
  } 

  onShare = () => {
    this.onEdit(true)
    this.setState({firstName: '', secondName : '', isAddMore : false})
  }

  onEdit = (visible) => {
    this.setState({ modalVisible: visible });         
  }

  onSend = () => {    
    const firstNameError = emailValidator(this.state.firstName)
    const lastNameError = emailValidator(this.state.secondName)

    if (this.state.isAddMore) {
      if (firstNameError || lastNameError ){
        Alert.alert(
          'Error',
          'You should type email address',
          [{text: 'OK', onPress: () => console.log('OK Pressed')}],
          {cancelable: false},
        );
        return
      }
    } else {
      if (firstNameError) {
        Alert.alert(
          'Error',
          'You should type email address',
          [{text: 'OK', onPress: () => console.log('OK Pressed')}],
          {cancelable: false},
        );
        return
      }
    } 

    this.setState({
      isLoading: true,
    })

    var emails = this.state.facility.sharedEmails ? this.state.facility.sharedEmails : []

    if (this.state.isAddMore) {
      emails.push(this.state.firstName)
      emails.push(this.state.secondName)

      const newEmails = this.state.firstName + ", " + this.state.secondName
      OTPSender.sendEmail(newEmails, this.state.facility.title + " : " + this.state.facility.facilityCode, 'facilityCode', this.onSentCode, this.onSentCodeFailed);
    } else {
      emails.push(this.state.firstName)

      OTPSender.sendEmail(this.state.firstName, this.state.facility.title + " : " + this.state.facility.facilityCode, 'facilityCode', this.onSentCode, this.onSentCodeFailed);
    }

    FACILITY_DB.updateDFacility(this.state.facility.facilityid, {sharedEmails: emails}, this.onAddDone)
  }

  onSentCode = () => {

  }

  onSentCodeFailed = () => {
    this.setState({
      isLoading: false,
    })
  }

  onAddDone = () => {
    this.setState({
      isLoading: false,
      modalVisible: false,
    })
  }

  leftAction = () => (
    <TouchableOpacity style={styles.leftAction} onPress={() => this.onSelectDelete()}>
      <Text style={styles.textAction}>Delete</Text>
    </TouchableOpacity>
  )

  onSelectDelete = () => {
    const item = this.state.selectedItem;
    Alert.alert(
      'Delete Email',
      `Are you sure want to delete "${item}"?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Delete",
          onPress: () => {
            this.onDelete(item)             
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  onDelete = (item) => {
    this.setState({
      isLoading: true,
    })

    var newEmails = this.state.facility.sharedEmails
    const index = newEmails.findIndex(email => email === item)
    newEmails.splice(index, 1)

    FACILITY_DB.updateDFacility(this.state.facility.facilityid, {sharedEmails: newEmails}, this.onAddDone)
  }  

  render() {
    return (
      <Background>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.onEdit(false);
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {styles.modalView}>

              <View style={styles.titleView}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}>Share Code</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity onPress={() => this.onEdit(false)} style={styles.closeButton}>
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={styles.firstNameText}>Email</Text>
              <TextInput
                style={styles.emailInput}
                value={this.state.firstName}
                onChangeText={ (text) => this.setState({firstName: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="emailAddress"
              />

              {this.state.isAddMore ? 
                <View>
                  <Text style={styles.lastNameText}>Email</Text>
                  <TextInput
                    style={styles.emailInput}
                    value={this.state.secondName}
                    onChangeText={ (text) => this.setState({secondName: text}) }
                    autoCapitalize="none"
                    autoCompleteType="name"
                    textContentType="emailAddress"
                  />
                </View>
                : <TouchableOpacity style={styles.addButton} onPress={() => this.setState({ isAddMore:true })}>
                    <Image style={{height: 25, width: 110}} source={require('../assets/images/survey/Addmore.png')}/>
                  </TouchableOpacity>              
              }

              <View style={{backgroundColor: theme.colors.inputBack, width: DEVICE_WIDTH, alignItems: 'center', marginTop: 32, marginBottom: 0}}>
                <TouchableOpacity style={styles.loginButton} onPress={() => this.onSend()}>
                  <Text style={styles.loginText}>Send Email</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style = {styles.navigationView}>  
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <View style={styles.titleView1}>
            <View style={{flex: 1}} />
            <Text style={styles.titleText}>{this.state.facility.title}</Text>
            <Text style={styles.codeText}>{this.state.facility.facilityCode}</Text>
          </View>
        </View>

        <View style={styles.listView}>

        { this.state.filteredData.length === 0 ?  
          <View style={styles.emptycontainerView}>     
            <Text style={styles.noRequestText}>Not shared with anyone yet.</Text>
          </View>
        : <View style={styles.listView}>
            <Text style={styles.noRequestText}>Code shared to</Text>
            <FlatList
              data={this.state.filteredData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item, index}) => (            
                <View style={{...styles.cellContentView, marginBottom: index === this.state.filteredData.length - 1 ? 32 : 3 }}>
                  <Swipeable
                    renderRightActions={this.leftAction}
                    onSwipeableRightOpen={() => this.setState({selectedItem: item}) }
                    >
                      <View style={styles.contentView}>
                        <Text style={styles.nameText}>{item}</Text>   
                        <View style={{flex: 1}}/>                                      
                      </View>
                  </Swipeable>
                </View>             
              )}
            /> 
          </View>
        }

          <View style={styles.saveView}>
            <TouchableOpacity style={styles.loginButton} onPress={() => this.onShare()}>
              <Text style={styles.loginText}>Share Code</Text>
            </TouchableOpacity>
          </View>
          
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
    alignItems: 'flex-end',
    justifyContent: 'center',
    alignContent: 'flex-end',
    flexDirection: 'row',
  },

  titleView1: {
    alignItems: 'center', 
    alignSelf: 'center' ,
  },

  titleText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  codeText: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: 'Poppins-Regular',
  },

  emptycontainerView: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
    
  listView: {
    flex: 1, 
    width: DEVICE_WIDTH,
  },
  
  cellContentView: {    
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 3,
    marginBottom: 3,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
  },

  contentView: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    marginTop: 12,
    marginBottom: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexDirection: 'row'
  },

  saveView: {
    width: DEVICE_WIDTH,
    marginBottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.inputBack
  },  

  noRequestText: {
    marginLeft: 16,
    marginTop: 16, 
    marginBottom: 8, 
    
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.lightGray, 
  },

  nameText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',     
  },

  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
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
    fontFamily: 'Poppins-Medium',
  },

  closeButton: {
    width: 60, 
    height: 60, 
    position: 'absolute',
    right: 10,
    top: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  coloseImage: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 44,
    height: 44,
  },  
  
  firstNameText: {
    height: 20,
    marginLeft: 16,
    marginTop: 42,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.darkGray,
    fontFamily: 'Poppins-Medium',
  },

  lastNameText: {
    height: 20,
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.darkGray,
    fontFamily: 'Poppins-Regular',
  },
  
  emailInput: {
    width: DEVICE_WIDTH - 32,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },    

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 16,
    marginBottom: 38,
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

  addButton: {
    width: DEVICE_WIDTH,
    height: 40,
    marginTop: 16,      
    alignItems: 'center',
    justifyContent: 'center',
  },

  leftAction: {
    width: 76, 
    backgroundColor: theme.colors.mainRed,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    marginTop: 0,
    marginBottom: 0,  
    justifyContent: 'center',
  }, 

  textAction: {
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Regular',
  }, 

  

}) 