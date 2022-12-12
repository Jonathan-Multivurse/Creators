import React, { Component } from 'react'
import { View, StyleSheet, Platform, Image, Dimensions, Text, FlatList, Modal, Alert, KeyboardAvoidingView, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import FACILITY_DB from '../api/facilityDB'
import { nameValidator } from '../helpers/nameValidator'
import {firebase} from '@react-native-firebase/auth'
import { Swipeable } from 'react-native-gesture-handler'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class FacilityScreen extends Component {
  constructor(props) {
    super(props)
    this._unsubscribeFocus = null;

    this.state = { 
      isLoading: false,   

      isAdmin: this.props.route.params.isAdmin,
      modalVisible: false, 
      isAddMore: false,
      firstName: '',
      secondName: '',
      searchText: '',
      isEdit: false,

      originalData: [],
      filteredData: []
    }
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getFacitlities();
    });
  }

  componentWillUnmount() {    
    this._unsubscribeFocus();
  } 

  getFacitlities = () => {            
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getFacilitiesRep', {
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
        originalData: responseJson.facilities,
        filteredData: responseJson.facilities
      });
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
    
  }

  onGetFacilities = (facilities) => {   
    this.setState({
      isLoading: false,
      originalData: facilities,
      filteredData: facilities
    })
  }

  onEdit = (visible) => {
    this.setState({ modalVisible: visible });         
  }

  searchFilter = (text) => {
    if (text) {
      const newData = this.state.originalData.filter(
        function(item){
          const itemData = item.title.toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
        }
      )
      this.setState({
        searchText: text,
        filteredData: newData,
      })
    } else {
      this.setState({
        searchText: '',
        filteredData: this.state.originalData,
      })
    }
  }

  onRight = () => {
    this.setState({
      isEdit: false,
      firstName: '',
      secondName : '',
      isAddMore : false
    })
    this.onEdit(true)    
  }

  onSelectDelete = () => {
    const item = this.state.selectedItem;
    
    item.title && Alert.alert(
      'Delete Facility',
      `Are you sure want to delete "${item.title}"?`,
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

  onSelectEdit = () => {
    const item = this.state.selectedItem;
    this.setState({
      firstName: item.title
    })

    this.onEdit(true)  

  }

  onDelete = (item) => {
    this.setState({
      isLoading: true,
    })
    FACILITY_DB.deleteFacility(item.facilityid, this.onAddDone)  
  }  

  onAdd = () => {    
    const firstNameError = nameValidator(this.state.firstName)
    const lastNameError = nameValidator(this.state.secondName)

    if (this.state.isEdit) {
      if (firstNameError) {
        Alert.alert(
          'Error',
          'You should type facility name',
          [{text: 'OK', onPress: () => console.log('OK Pressed')}],
          {cancelable: false},
        );
        return
      }
    } else {
      if (this.state.isAddMore) {
        if (firstNameError || lastNameError ){
          Alert.alert(
            'Error',
            'You should type facility names',
            [{text: 'OK', onPress: () => console.log('OK Pressed')}],
            {cancelable: false},
          );
          return
        }
      } else {
        if (firstNameError) {
          Alert.alert(
            'Error',
            'You should type facility name',
            [{text: 'OK', onPress: () => console.log('OK Pressed')}],
            {cancelable: false},
          );
          return
        }
      } 
    }

    

    this.setState({
      isLoading: true,
    })

    if (this.state.isEdit) {
      FACILITY_DB.updateFacility(this.state.selectedItem.facilityid, this.state.firstName, this.onAddDone)
    } else {
      if (this.state.isAddMore) {
        FACILITY_DB.addFacility(this.state.firstName, FACILITY_DB.addFacility(this.state.secondName, this.onAddDone))   
  
      } else {
        FACILITY_DB.addFacility(this.state.firstName, this.onAddDone)
      }
    }    
  }

  onAddDone = () => {
    this.setState({
      isLoading: false,
      modalVisible: false,
      selectedItem: null
    })

    this.getFacitlities()
  }

  rightAction = () => (
    <TouchableOpacity style={styles.rightAction} onPress={() => this.onSelectDelete()}>
      <Text style={styles.textAction}>Delete</Text>
    </TouchableOpacity>
  )

  leftAction = () => (
    <TouchableOpacity style={styles.leftAction} onPress={() => this.onSelectEdit()}>
      <Text style={styles.textAction}>Edit</Text>
    </TouchableOpacity>
  )

  selectFacility = (item) => {
    this.setState({
      searchText: ''
    })

    this.props.navigation.navigate('FacilitySimulators', {
      facility: item,
      isAdmin: this.state.isAdmin
    })  
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
                <Text style={styles.editPText}>{this.state.isEdit ? 'Edit Facility' : 'New Facility'}</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity onPress={() => this.onEdit(false)} style={styles.closeButton}>
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={styles.firstNameText}>Facility Name</Text>
              <TextInput
                style={styles.emailInput}
                value={this.state.firstName}
                onChangeText={ (text) => this.setState({firstName: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
              />

              {this.state.isEdit ? <View/> : this.state.isAddMore ?
              <View>
                <Text style={styles.lastNameText}>Facility Name</Text>
                <TextInput
                  style={styles.emailInput}
                  value={this.state.secondName}
                  onChangeText={ (text) => this.setState({secondName: text}) }
                  autoCapitalize="none"
                  autoCompleteType="name"
                  textContentType="name"
                />
              </View>
              : <TouchableOpacity style={styles.addButton} onPress={() => this.setState({ isAddMore:true })}>
                  <Image style={{height: 25, width: 110}} source={require('../assets/images/survey/Addmore.png')}/>
                </TouchableOpacity>
              }

              <View style={{backgroundColor: theme.colors.inputBack, width: DEVICE_WIDTH, alignItems: 'center', marginTop: 32, marginBottom: 0}}>
                <TouchableOpacity style={styles.loginButton} onPress={() => this.onAdd()}>
                  <Text style={styles.loginText}>{this.state.isEdit? 'Save' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style = {styles.navigationView}>  
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Facilities</PageTitle>

          {this.state.isAdmin && <TouchableOpacity style={styles.rightButton} onPress={() => this.onRight()} >
            <Image
              style={styles.rightImage}
              source={require('../assets/images/survey/Plus_yellow.png')}
            />
          </TouchableOpacity>
          }
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

          <FlatList
          contentContainerStyle={{ paddingBottom: 32 }}
          data={this.state.filteredData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => (            
            <TouchableOpacity style={styles.cellContentView} onPress={() => this.selectFacility(item)}>
              <Swipeable
                renderRightActions={this.rightAction}
                onSwipeableRightOpen={() => this.setState({selectedItem: item, isEdit: false})}
                renderLeftActions={this.leftAction}
                onSwipeableLeftOpen={() => this.setState({selectedItem: item, isEdit: true})}
                >
                  <View style={styles.nameView}>
                    <Text style={styles.nameText}>{item.title}</Text>   
                    <View style={{flex: 1}}/>
                    <View style={styles.arrowButton} >
                      <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
                    </View>                                         
                  </View>
                  <View style={styles.contentView}>
                    <Text style={styles.simulatorText}>{item.branch && item.branch.length ? item.branch.length < 2 ? item.branch.length + ' branch' : item.branch.length + ' branches' : '0 branch'}</Text>   
                    
                    <Text style={styles.employeeText}>  *  </Text> 
                    <Text style={styles.simulatorText}>{ !item.simulators ? '0 Simulator' : item.simulators.length < 2 ? item.simulators.length + ' Simulator' : item.simulators.length + ' Simulators' }</Text> 

                    <Text style={styles.employeeText}>  *  </Text>
                    <Text style={styles.simulatorText}>{item.employees.length < 2 ? item.employees.length + ' Employee' : item.employees.length + ' Employees'}</Text>                  
                                                           
                  </View>
              </Swipeable>
            </TouchableOpacity>             
          )}
          /> 
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
  
  searchView: {
    width: DEVICE_WIDTH - 32,
    height: 36,  
    marginTop: 12,  
    marginBottom: 14, 
    marginLeft: 16,
    borderRadius: 10,    
    backgroundColor: theme.colors.searchBar,
    flexDirection: 'row',
  },
  
  searchInput:{
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
    
  listView: {
    flex: 1, 
    width: DEVICE_WIDTH,
  },

  cellContentView: {    
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
  },

  nameView: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    marginTop: 13,
    marginBottom: 3,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexDirection: 'row',
  },

  contentView: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    marginTop: 3,
    marginBottom: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexDirection: 'row',
  },  

  nameText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',     
  },

  arrowImage: {
    width: 10,
    height: 16,
  },

  employeeText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.darkGray,  
  },

  simulatorText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.darkGray,    
  },

  statusView: {
    height: 27,
    marginTop: 2,   
    borderRadius: 13.5,
    paddingHorizontal: 12, 
    paddingTop: 2,
  },

  statusText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium', 
    color: 'white',
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
    width: 26,
    height: 26,
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

  lastNameText: {
    marginLeft: 0,
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
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

  rightAction: {
    width: 76, 
    backgroundColor: theme.colors.mainRed,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    marginTop: 0,
    marginBottom: 0,  
    justifyContent: 'center',
  }, 

  leftAction: {
    width: 76, 
    backgroundColor: theme.colors.mainRed,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
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

  arrowButton: {
    width: 25,
    height: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  arrowImage: {
    width: 10,
    height: 16,
  },
}) 