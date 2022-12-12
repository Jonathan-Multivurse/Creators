import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, StyleSheet, Platform, Image, Dimensions, Text, FlatList, Modal, Alert, KeyboardAvoidingView, TextInput, TouchableOpacity, ActivityIndicator, SectionList, ScrollView} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import * as RNLocalize from 'react-native-localize'
import { theme } from '../core/theme'
import moment from 'moment'
import FACILITY_DB from '../api/facilityDB'
import REQUEST_DB from '../api/requestDB'
import USER_DB from '../api/userDB'
import { nameValidator } from '../helpers/nameValidator'
import firestore from '@react-native-firebase/firestore'
import { Swipeable, TouchableWithoutFeedback } from 'react-native-gesture-handler'
import SelectDropdown from 'react-native-select-dropdown'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import { 
  usersGet,
  usersSelect,
  webrtcCall,
  usersChatSelect,
  dialogCreate, 
  dialogCreateCancel, 
  messageSend 
} from '../actionCreators'
import { showError } from '../NotificationService'
import QB from 'quickblox-react-native-sdk'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

const arySMakes = ['CAE', 'Gaumard', 'Laerdal']
const arySModels = ['S575.100', 'S901', 'S1001', 'S2000', 'S2200', 'S2209', 'S2210', 'S2225', 'S3000', 'S3004', 'S3005', 'S3040', 'S3040.50', 'S3101', 'S3201']

class FacilitySimulators extends Component {
  constructor(props) {
    super(props)
    this._observer = null;

    this.state = { 
      isLoading: false,   
      isAdmin: this.props.route.params.isAdmin,       
      facility: this.props.route.params.facility,     
      segementIndex: 0,

      originalUserData: [],
      filteredUserData: [],
      selectedUser: null,

      curUser: null,
      selectedSender: null,
      isCallModal: false,
      supportType: '',
      description: '',
      supportFacilityName: '',
      supportBranchName: '',
      supprotSimulator: '',
      isSimulatorModal: false,
      searchText: '',
      createdDialog: '',

      originalUSData: [],
      filteredUSData: [],

      originalBranchData: [],
      filteredBranchData: [],
      selectedBranch: null,
      
      filteredData: [],
      originalSimulatorData: [],
      filteredSimulatorData: [],     
      
      isEditBranch: false, 
      modalNewBranch: false, 
      branchName: '',
      modalSelectSimulator: false, 
      branchSimulators: [],  

      isEditSimulator: false, 
      modalNewSimulator: false, 
      relatedBranch: null,
      selectedSimulator: null, 
      simulatorName: '',
      simulatorMake: '',
      simulatorModel: '',
      simulatorSerial: '',               
    }    
  }

  componentDidMount() {
    this.setState({
      isLoading: true,
    }) 

    USER_DB.getProfile(this.onUserGet)
    

    this.getFilteringUser(this.props.route.params.facility.employees)
    this.getFilteringBranch(this.props.route.params.facility.branch)
    this.setSimulators(this.props.route.params.facility.simulators)

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

          this.getFilteringBranch(updatedData.branch)
          this.setSimulators(updatedData.simulators)
        }        
      }
    })
  }

  componentWillUnmount() {    
    this._observer();
  } 

  getFilteringUser = (users) => {
    users.sort(function(first, second)  {
      const fTitle = (first.firstname + ' ' + first.lastname).toUpperCase()
      const sTitle = (second.firstname + ' ' + second.lastname).toUpperCase()
      if (fTitle < sTitle) {
        return -1;
      }
      if (fTitle > sTitle) {
        return 1;
      }
      return 0;
    })

    var tmpUsers = []
    const tmpFacilityID = this.state.facility.facilityid
    
    users.forEach(user => {
      var tmpFacility = []
      user.facility.forEach(item => {
        if (tmpFacilityID === item.facility){
          tmpFacility.push(item)
        }            
      })

      var tmpUser = {...user}
      tmpUser.facility = tmpFacility
      tmpUser.expand = false

      tmpUsers.push(tmpUser)
    });

    this.setState({
      originalUserData: tmpUsers,
      filteredUserData: tmpUsers
    })
  }

  getFilteringBranch = (branches) => {
    branches.sort(function(first, second)  {
      const fTitle = first.name.toUpperCase()
      const sTitle = second.name.toUpperCase()
      if (fTitle < sTitle) {
        return -1;
      }
      if (fTitle > sTitle) {
        return 1;
      }
      return 0;
    })

    var tmpBranches = []
    const users = this.props.route.params.facility.employees
    const tmpFacilityID = this.state.facility.facilityid
    
    branches.forEach(branch => {
      var tmpBranch = {...branch}
      
      var tmpUsers = []
      const tmpName = tmpBranch.name
      users.forEach(user => {
        user.facility.forEach(item => {
          if (tmpFacilityID == item.facility && tmpName == item.branch ){
            tmpUsers.push(user)
          }            
        })
      })

      tmpBranch.employees = tmpUsers

      tmpBranches.push(tmpBranch)
    });

    this.setState({
      originalBranchData: tmpBranches,
      filteredBranchData: tmpBranches
    })
  }

  setSimulators = (simulators) => {
    this.setState({
      originalSimulatorData: simulators,
      filteredSimulatorData: simulators
    })

    this.getFilteringSimulator(simulators)
  }

  getFilteringSimulator = (simulators) => {
    // Filtering Simulators
    var branchData = []
    const branches = this.state.facility.branch

    branches.sort(function(first, second)  {
      const fTitle = first.name.toUpperCase()
      const sTitle = second.name.toUpperCase()
      if (fTitle < sTitle) {
        return -1;
      }
      if (fTitle > sTitle) {
        return 1;
      }
      return 0;
    })

    if ( branches.length > 0 ) {
      branches.forEach(branch => {            
        var branchSimulatorData = []  
        branch.simulators.forEach(simulatorID => {
          simulators.forEach(simulator => {
            if (simulator.simulatorid == simulatorID){
              branchSimulatorData.push({...simulator, expand: false})
            }            
          })
        })
  
        branchSimulatorData.sort(function(first, second)  {
          const fTitle = first.name.toUpperCase()
          const sTitle = second.name.toUpperCase()
          if (fTitle < sTitle) {
            return -1;
          }
          if (fTitle > sTitle) {
            return 1;
          }
          return 0;
        })
    
        branchData.push({branch: branch, data: branchSimulatorData})
      });
    }

    this.setState({filteredData : branchData}) 
  }

  generateCode = () => {
    if (this.state.facility.facilityCode) {
      this.props.navigation.navigate('FacilityCodeShare', {
        facility: this.state.facility
      })  
    } else {
      var code = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < 5; i++ ) {
        code += characters.charAt(Math.floor(Math.random() * charactersLength));
      }  

      FACILITY_DB.updateDFacility(this.state.facility.facilityid, {facilityCode: code}, this.onAddDone)
    }
  }

  onTimeZone = () => {
    this.props.navigation.navigate('TimeZoneScreen', {
      onGoBackFromOptions: (item) => this._onGoBackFromOptions(item)
    })
  }

  _onGoBackFromOptions = (item) => {
    FACILITY_DB.updateDFacility(this.state.facility.facilityid, {timezone: item}, this.onAddDone)
  }

  searchFilter = (text) => {
    if (text) {      
      const newUserData = this.state.originalUserData.filter(
        function(item){
          const itemData = (item.firstname + ' ' + item.lastname).toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
        }
      )

      const newBranchData = this.state.originalBranchData.filter(
        function(item){
          const itemData = item.name.toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
        }
      )

      const newSimulatorData = this.state.originalSimulatorData.filter(
        function(item){
          const itemData = item.name.toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
        }
      )

      this.setState({        
        filteredUserData: newUserData,
        filteredBranchData: newBranchData, 
        filteredSimulatorData: newSimulatorData
      })

      this.getFilteringSimulator(newSimulatorData)

    } else {
      this.setState({        
        filteredUserData: this.state.originalUserData,
        filteredBranchData: this.state.originalBranchData,
        filteredSimulatorData: this.state.originalSimulatorData,
      })

      this.getFilteringSimulator(this.state.originalSimulatorData)
    }
  }   

  onRight = () => {
    if (this.state.segementIndex == 1){
      this.setState({
        isEditBranch: false,
        modalNewBranch: true,
        branchName: '',
        branchSimulators: []
      })      
    } else {
      this.setState({
        isEditSimulator: false,
        modalNewSimulator: true,        
        simulatorName: '',
        simulatorMake: '',
        simulatorModel: '',
        simulatorSerial: '',
      })
    }    
  }

  onUserGet = (user) => {
    this.setState({
      curUser: user,
    })
  }

  // Employees Actions
  modalUser = (user) => {
    var tmpUsers = this.state.filteredUserData
    const tmpIndex = tmpUsers.indexOf(user)
    var user = tmpUsers[tmpIndex];

    if (!this.state.isAdmin) {
      this.setState({
        selectedSender: user,
        isCallModal: true,
        supportType: '',
        description: '',
        supportFacilityName: '',
        supportBranchName: '',
        supprotSimulator: '',
        isSimulatorModal: false,
        searchText: '',
        createdDialog: '',
      }) 

    }   
    
    this.onGetFacilities(user);
  }

  onGetFacilities = (user) => {    
    var simulatorData = []
    const currentFacilityIds = user.facility

    currentFacilityIds.map(facilityItem => {
      const facilityID = facilityItem.facility
      const tmpFacility = this.state.facility
      if (facilityID === tmpFacility.facilityid) {
        const branchName = facilityItem.branch
        const branches = tmpFacility.branch     
        const tmpBranch = branches.filter(branch => branch.name === branchName)[0]

        const simulatorIDs = tmpBranch.simulators
        const simulators = tmpFacility.simulators

        var tmpSimulators = []
        simulatorIDs.forEach(simulatorID => {
          const tmpSimulator = simulators.filter(simulator => simulator.simulatorid === simulatorID)[0]
          tmpSimulators.push(tmpSimulator)
        })

        simulatorData.push(
          {
            branch: { facility: tmpFacility, branch: tmpBranch},
            data: tmpSimulators
          }
        )
      }      
    })
    
    this.setState({
      isLoading: false,
      originalUSData: simulatorData,
      filteredUSData: simulatorData
    })
  }

  selectSimulatorRow = (item, section) => {
    this.setState({
      supportFacilityName: section.branch.facility.title,
      supportBranchName: section.branch.branch.name,
      supprotSimulator: item.name,
      filteredUSData: this.state.originalUSData,
      searchText: '',
      isCallModal: true,
      isSimulatorModal: false
    });    
  }

  searchFilter1 = (text) => {
    if (text) {
      const textData = text.toUpperCase()
      var newData = []

      this.state.originalUSData.forEach(element => {
        const simulators = element.data
        const newSimulators = simulators.filter(
          function(item){
            const itemData = item.name.toUpperCase()            
            return itemData.indexOf(textData) > -1
          }
        )

        if (newSimulators.length > 0) {
          newData.push(
            {
              branch: element.branch,
              data: newSimulators
            }
          )
        }
      })

      this.setState({
        searchText: text,
        filteredUSData: newData,
      })
    } else {
      this.setState({
        searchText: '',
        filteredUSData: this.state.originalUSData,
      })
    }
  }

  onSupportTypeRow = (item) => {
    this.setState({
      supportType: item
    })
  }

  onSimulatorSelect = () => {
    this.setState({
      isSimulatorModal: true,
      isCallModal: false,
    })
  }

  onSendRequest = () => {
    if (this.state.supportType == '') {
      Alert.alert(
        "Warning",
        `Please select type for this support.`,
        [
          {
            text: "Ok",
          },
        ],
        { cancelable: false }
      );
      return
    }

    if (this.state.description == '') {
      Alert.alert(
        "Warning",
        `Please type description for this support.`,
        [
          {
            text: "Ok",
          },
        ],
        { cancelable: false }
      );
      return
    } else {
      this.setState({isLoading: true})  

      const { createDialog, navigation, selected } = this.props

      const phoneTzCode = RNLocalize.getTimeZone()
      const currentTimezone = {
        "label": '',
        "name": '',
        "tzCode": phoneTzCode,
        "utc": '',
      } 

      if (this.state.supportType == 'Call') {
        REQUEST_DB.addRequest('Call', this.state.supportFacilityName, this.state.supprotSimulator, new Date().getTime(), 'accepted', false, new Date().getTime(), currentTimezone, this.state.description, '', this.state.selectedSender, this.state.curUser.userid, this.state.curUser, this.onCallSubmit)
      } else if (this.state.supportType == 'Video') {
        REQUEST_DB.addRequest('Video', this.state.supportFacilityName, this.state.supprotSimulator, new Date().getTime(), 'accepted', false, new Date().getTime(), currentTimezone, this.state.description, '', this.state.selectedSender, this.state.curUser.userid, this.state.curUser, this.onCallSubmit)
      } else if  (this.state.supportType == 'Chat'){  

        new Promise((resolve, reject) => {
          const dialogName = this.state.curUser.firstname + '-' + this.state.supprotSimulator + moment().format('hh:mm-DD-MM')          
          createDialog({ name: dialogName, type: QB.chat.DIALOG_TYPE.GROUP_CHAT, occupantsIds: [this.state.selectedSender.QBId, this.state.curUser.QBId], resolve, reject })
        })
        .then(action => {
          const dialog = action.payload
          this.setState({createdDialog: dialog})

          REQUEST_DB.addRequest('Chat', this.state.supportFacilityName, this.state.supprotSimulator, new Date().getTime(), 'accepted', false, new Date().getTime(), currentTimezone, this.state.description, dialog, this.state.selectedSender, this.state.curUser.userid, this.state.curUser, this.onChatSubmit)
        })
        .catch(action => showError('Failed to create dialog', action.error))
      }   
    }    
  }

  onCallSubmit = async (request) => {
    this.setState({
      isCallModal: false,
    })

    var user = this.state.selectedSender

    const { selectUser, selected = [] } = this.props
    const index = selected.findIndex(item => item.id === user.QBId)

    if (index > -1 || selected.length < 3) {
      const username = (user.firstname +  " " + user.lastname) || user.email
      selectUser({ id: user.QBId, name: username })
    } else {
      showError(
        'Failed to select user',
        'You can select no more than 3 users'
      )
    }

    global.selectedRequest = request

    setTimeout(() => {
      this.initCall() 
    }, 200); 
  }

  initCall = () => {
    this.setState({
      isLoading: false,
    })

    const { call, selected } = this.props
    const opponentsIds = selected.map(user => user.id)
    try {
      if (this.state.supportType === 'Call') {
        call({ opponentsIds, type: QB.webrtc.RTC_SESSION_TYPE.AUDIO })
      } else {
        call({ opponentsIds, type: QB.webrtc.RTC_SESSION_TYPE.VIDEO })
      }      
    } catch (e) {
      showError('Audo Error', e.message)
    }
  }

  onChatSubmit = async (request) => {
    this.setState({
      isCallModal: false,
      isLoading: false    
    })

    const { createDialog, navigation, selected } = this.props
    global.selectedRequest = request
    global.curUser = this.state.curUser 
    const dialog = this.state.createdDialog    
    navigation.navigate('Messages', {dialog})
  }

  expandOnUser = (user) => {
    var tmpUsers = this.state.filteredUserData
    const tmpIndex = tmpUsers.indexOf(user)
    var user = tmpUsers[tmpIndex]

    user.expand = !user.expand

    tmpUsers.splice(tmpIndex, 1);
    tmpUsers.splice(tmpIndex, 0, user);

    this.setState({
      filteredUserData : tmpUsers
    })       
  }

  leftUserAction = () => (
    <TouchableOpacity style={styles.leftAction} onPress={() => this.onSelectUserDelete()}>
      <Text style={styles.textAction}>Delete</Text>
    </TouchableOpacity>
  )  

  onSelectUserDelete = () => {
    const item = this.state.selectedUser;
    Alert.alert(
      'Delete an Employee',
      `Are you sure want to remove ${item.firstname + ' ' + item.lastname}'s access to this Facility?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Delete",
          onPress: () => {
            this.onRemoveUser(item)             
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  onRemoveUser = (item) => {
    this.setState({
      isLoading: true,
    })

    var tmpUser = this.props.route.params.facility.employees.filter(employee => employee.userid == item.userid)[0]
    var tmpFacility = []
    const tmpFacilityID = this.state.facility.facilityid
    tmpUser.facility.forEach(item => {
      if (tmpFacilityID != item.facility){
        tmpFacility.push(item)
      }            
    })

    USER_DB.updateAUser(item.userid, {facility: tmpFacility}, this.onUserRemoveDone)
  }  

  onUserRemoveDone = () => {
    const selectedUser = this.state.selectedUser
    var employees = this.state.originalUserData

    const newUserData = employees.filter(employee => employee.userid != selectedUser.userid)

    this.setState({
      isLoading: false,
      originalUserData: newUserData,
      filteredUserData: newUserData,
    })
  }

  // Branches Actions
  leftBranchAction = () => (
    <TouchableOpacity style={styles.leftAction} onPress={() => this.onSelectBranchDelete()}>
      <Text style={styles.textAction}>Delete</Text>
    </TouchableOpacity>
  )  

  onSelectBranchDelete = () => {
    const item = this.state.selectedBranch;

    Alert.alert(
      'Delete Branch',
      `Are you sure want to remove ${item.name} from this Facility?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Delete",
          onPress: () => {
            this.onRemoveBranch(item)             
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  onRemoveBranch = (branchItem) => {
    this.setState({
      isLoading: true,
    })

    // remove branch
    var newBranches = this.state.facility.branch.filter(element => element.branchid != branchItem.branchid)
    FACILITY_DB.updateDFacility(this.state.facility.facilityid, {branch: newBranches}, this.onAddDone)

    // remove faciltiy of Users
    const batch = firestore().batch();  
    const curFacilityID = this.state.facility.facilityid
    const curBranchName = branchItem.name
    branchItem.employees.forEach(employee => {
      var tmpFacility = []
      employee.facility.forEach(facility => {
        if (!(facility.facility == curFacilityID && facility.branch == curBranchName)){
          tmpFacility.push(facility)
        }             
      })

      // USER_DB.updateUser(employee.userid, {facility: tmpFacility})
      employeeRef =  firestore().collection('users').doc(employee.userid)
      batch.update(employeeRef, 'facility', tmpFacility);
    })
   
    return batch.commit();
  }  

  onUserRemoveDone = () => {
    const selectedUser = this.state.selectedUser
    var employees = this.state.originalUserData

    const newUserData = employees.filter(employee => employee.userid != selectedUser.userid)

    this.setState({
      isLoading: false,
      originalUserData: newUserData,
      filteredUserData: newUserData,
    })
  }

  onTapSimulator = (item) => {
    var tmpSimulatorIDs = this.state.branchSimulators
    if (tmpSimulatorIDs.includes(item.simulatorid)) {
      const tmpIndex = tmpSimulatorIDs.indexOf(item.simulatorid)
      tmpSimulatorIDs.splice(tmpIndex, 1)
    } else {
      tmpSimulatorIDs.push(item.simulatorid)
    }

    this.setState({
      branchSimulators: tmpSimulatorIDs
    })
  }

  onAddBranch = () => {
    const nameError = nameValidator(this.state.branchName)

    if (nameError) {
      Alert.alert(
        'Error',
        'You should type branch name',
        [{text: 'OK', onPress: () => console.log('OK Pressed')}],
        {cancelable: false},
      );
      return
    }

    this.setState({
      isLoading: true,
    })

    if (this.state.isEditBranch) {
      const branchItem = this.state.selectedBranch;
      const curBranchName = branchItem.name
      const newBranchName = this.state.branchName
      const curBranchID = branchItem.branchid

      // Update branch
      var newBranches = this.state.facility.branch
      const branchIndex = newBranches.findIndex(branch => {
        return branch.branchid === curBranchID;
      })
      newBranches.splice(branchIndex, 1)
      newBranches.push({branchid: curBranchID, name: newBranchName, simulators: this.state.branchSimulators})
      FACILITY_DB.updateDFacility(this.state.facility.facilityid, {branch: newBranches}, this.onAddDone)

      // Update Faciltiy of Users
      const batch = firestore().batch();  
      const curFacilityID = this.state.facility.facilityid

      branchItem.employees.forEach(employee => {
        var tmpFacility = []
        employee.facility.forEach(facilityItem => {
          if (facilityItem.facility == curFacilityID && facilityItem.branch == curBranchName){
            tmpFacility.push({facility: curFacilityID, branch: newBranchName, access: facilityItem.access})
          } else {
            tmpFacility.push(facilityItem)
          }             
        })
        // USER_DB.updateUser(employee.userid, {facility: tmpFacility})
        employeeRef =  firestore().collection('users').doc(employee.userid)
        batch.update(employeeRef, 'facility', tmpFacility);
      })
    
      return batch.commit();
    } else {
      var code = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < 7; i++ ) {
        code += characters.charAt(Math.floor(Math.random() * charactersLength));
      }  

      var newBranches = this.state.facility.branch
      newBranches.push({branchid: code, name: this.state.branchName, simulators: this.state.branchSimulators})

      FACILITY_DB.updateDFacility(this.state.facility.facilityid, {branch: newBranches}, this.onAddDone)
    }
  }

  onSelectEditBranch = (item) => {
    this.setState({
      isEditBranch: true,
      modalNewBranch: true,
      selectedBranch: item,
      branchName: item.name,
      branchSimulators: item.simulators
    })
  }

  // Simulators Actions  
  expandOnSimulator = (item, section) => {
    var branchData = this.state.filteredData 
    const branchIndex = branchData.indexOf(section)

    var simulatorData = section.data
    const simulatorIndex = simulatorData.indexOf(item)

    var tmpSimulator = item
    tmpSimulator.expand = !tmpSimulator.expand
    simulatorData.splice(simulatorIndex, 1);
    simulatorData.splice(simulatorIndex, 0, tmpSimulator);

    var tmpSection = section
    tmpSection.data = simulatorData
    branchData.splice(branchIndex, 1);
    branchData.splice(branchIndex, 0, tmpSection);

    this.setState({
      filteredData : branchData
    })       
  }

  leftSimulatorAction = () => (
    <TouchableOpacity style={styles.leftAction} onPress={() => this.onSelectSimulatorDelete()}>
      <Text style={styles.textAction}>Delete</Text>
    </TouchableOpacity>
  )

  onSelectSimulatorDelete = () => {
    const item = this.state.selectedSimulator
    const branch = this.state.relatedBranch

    Alert.alert(
      'Delete Simulator',
      `Are you sure want to delete "${item.name}" from "${branch.branch.name}"?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Delete",
          onPress: () => {
            this.onSimulatorDelete()             
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  onSimulatorDelete = () => {
    this.setState({
      isLoading: true,
    })

    const relatedBranch = this.state.relatedBranch
    const selectedSimulator = this.state.selectedSimulator  

    var branchData = this.state.facility.branch
    const branchIndex = branchData.findIndex(branch => {
      return branch.branchid === relatedBranch.branch.branchid;
    });

    var tmpBranch = this.state.facility.branch[branchIndex]
    var newSimulators = tmpBranch.simulators

    const simulatorIndex = newSimulators.findIndex(simulator => {
      return simulator == selectedSimulator.simulatorid;
    });

    newSimulators.splice(simulatorIndex, 1)

    tmpBranch.simulators = newSimulators

    branchData.splice(branchIndex, 1)
    branchData.splice(branchIndex, 0, tmpBranch)

    FACILITY_DB.updateDFacility(this.state.facility.facilityid, {branch: branchData}, this.onAddDone)
  } 

  setSimulatorProp = async(variableName, value) => {
    if (variableName == 'simulatorName') {
      this.setState({
        simulatorName: value
      })
    } else if (variableName == 'simulatorMake') {
      this.setState({
        simulatorMake: value
      })
    } else if (variableName == 'simulatorModel') {
      this.setState({
        simulatorModel: value
      })
    } else {
      this.setState({
        simulatorSerial: value
      })
    }    
  }

  onAddSimulator = () => {    
    const nameError = nameValidator(this.state.simulatorName)

    if (nameError) {
      Alert.alert(
        'Error',
        'You should type simulator name',
        [{text: 'OK', onPress: () => console.log('OK Pressed')}],
        {cancelable: false},
      );
      return
    }

    this.setState({
      isLoading: true,
    })

    if (this.state.isEditSimulator) {
      var newSimulators = this.state.originalSimulatorData
      const tmpSimulator = this.state.selectedSimulator

      const tmpIndex = newSimulators.findIndex(object => {
        return object.simulatorid === tmpSimulator.simulatorid;
      });

      newSimulators.splice(tmpIndex, 1)
      newSimulators.splice(tmpIndex, 0, {simulatorid:  tmpSimulator.simulatorid, name: this.state.simulatorName, make: this.state.simulatorMake, model: this.state.simulatorModel, serial: this.state.simulatorSerial})

      FACILITY_DB.updateDFacility(this.state.facility.facilityid, {simulators: newSimulators}, this.onAddDone)
    } else {  
      var code = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < 5; i++ ) {
        code += characters.charAt(Math.floor(Math.random() * charactersLength));
      }  

      var newSimulators = this.state.facility.simulators
      newSimulators.push({simulatorid: code, name: this.state.simulatorName, make: this.state.simulatorMake, model: this.state.simulatorModel, serial: this.state.simulatorSerial})

      FACILITY_DB.updateDFacility(this.state.facility.facilityid, {simulators: newSimulators}, this.onAddDone)
    }    
  }

  onAddDone = () => {
    this.setState({
      isLoading: false,
      isEditBranch: false,
      modalNewBranch: false,   
      
      isEditSimulator: false,
      modalNewSimulator: false
    })
  }

  onSelectEditSimulator = (item) => {
    this.setState({
      isEditSimulator: true,
      modalNewSimulator: true, 
      selectedSimulator: item,
      simulatorName: item.name ? item.name : '',
      simulatorMake: item.make ? item.make : '',
      simulatorModel: item.model ? item.model : '',
      simulatorSerial: item.serial ? item.serial : '',
    })
  }  
 
  render() {    
    return (
      <Background>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.isCallModal}
          onRequestClose={() => {
            this.setState({ isCallModal: false });  
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {styles.modalView}>

              <View style={styles.titleView1}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}>Initiate Support</Text>
                <View style={{flex: 1}}/>

                <TouchableOpacity onPress={() => this.setState({ isCallModal: false }) } style={styles.closeButton}>
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>        

              <Text style={styles.selectText}>Support</Text>
                <View style={styles.supportView}>             
                  <TouchableWithoutFeedback onPress={ () => this.onSupportTypeRow('Call')}>
                    <View style={(this.state.supportType == 'Call') ? {...styles.cellSelectedContentView, shadowColor: theme.colors.callShadow} : styles.cellUnSelectContentView}>
                      <Image style={styles.callImage} source={require('../assets/images/home/iconVoice.png')}  />
                      <Text style={styles.callText}>Call</Text>
                    </View>
                  </TouchableWithoutFeedback>
                  <TouchableWithoutFeedback onPress={ () => this.onSupportTypeRow('Video')}>
                    <View style={(this.state.supportType == 'Video') ? {...styles.cellSelectedContentView, shadowColor: theme.colors.videoShadow} : styles.cellUnSelectContentView}>
                      <Image style={styles.callImage} source={require('../assets/images/home/iconVideo.png')}  />
                      <Text style={styles.callText}>Video</Text>
                    </View>
                  </TouchableWithoutFeedback>
                  <TouchableWithoutFeedback onPress={ () => this.onSupportTypeRow('Chat')}>
                    <View style={(this.state.supportType == 'Chat') ? {...styles.cellSelectedContentView, shadowColor: theme.colors.chatShadow} : styles.cellUnSelectContentView}>
                      <Image style={styles.callImage} source={require('../assets/images/home/iconChat.png')}  />
                      <Text style={styles.callText}>Chat</Text>
                    </View>
                  </TouchableWithoutFeedback>
              </View>   

              <Text style={{...styles.pleaseText, marginTop: 12}}>Please select a branch and simulator that you are supporting for</Text>
                <View style ={styles.simulatorView}>
                  <Text style={{fontSize: 17, lineHeight: 24, fontFamily: 'Poppins-Medium', }}>Simulator </Text>
                  <Text style={{fontSize: 17, lineHeight: 24, fontFamily: 'Poppins-Regular', }}>(Optional)</Text>
                </View> 

                <TouchableOpacity style={styles.simulatorButton} onPress={() => this.onSimulatorSelect()}  >
                  <Text style={this.state.supprotSimulator == '' ? styles.nonsimulatorText : styles.simulatorText}>{this.state.supprotSimulator == '' ? 'Select' : this.state.supprotSimulator }</Text>
                  <View style={{flex: 1}}/>
                  <Image source={require('../assets/images/account/arrow_forward.png')} style={styles.chevronImage}/>
                </TouchableOpacity>

                <View style={{flexDirection: 'row'}}>
                  <Text style={styles.selectText}>Description</Text> 
                  <View style={{flex:1}}/>
                  <Text style={styles.countText}>{this.state.description.length}/100</Text> 
                </View>
                
                <TextInput
                  style={styles.emailInput1}
                  blurOnSubmit={true}
                  multiline={true}
                  value={this.state.description}
                  onChangeText={(text) => this.setState({description: text}) }
                  autoCapitalize="none"
                  autoCompleteType="name"
                  textContentType="name"
                /> 

                <View style={styles.addButtonView}>
                  <TouchableOpacity style={styles.loginButton} onPress={() => this.onSendRequest()}>
                    <Text style={styles.loginText}>Initiate {this.state.supportType} Support</Text>
                  </TouchableOpacity>
                </View>  
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.isSimulatorModal}
          onRequestClose={() => {
            this.setState({isSimulatorModal : false})
          }}
        >
          <View style={styles.centeredView2}>
            <View style = {styles.titleView2}>
              <View style={{flex:1}}/>
              <Text style={styles.editPText1}>Select Simulator</Text> 
              <View style={{flex:1}}/>
              <TouchableOpacity onPress={() => this.setState({isCallModal: true, isSimulatorModal: false})} style={styles.closeButton1}>
                <Image style={styles.coloseImage1} source={require('../assets/images/account/icon_gclose.png')}/>
              </TouchableOpacity>
            </View>

            <View style={styles.searchView1}>              
              <TextInput
                style= {styles.searchInput1}
                returnKeyType="search"
                value={this.state.searchText}
                onChangeText={(text) => this.searchFilter1(text)}
                underlineColorAndroid="transparent"
                placeholder="Search"
              />
            </View> 

            <View style={styles.listView1}>
              <SectionList
                sections={this.state.filteredUSData}
                keyExtractor={(item, index) => item + index}
                renderSectionHeader={({ section: {branch} }) => (
                  <View style = {styles.sectionView}>
                    <Text style={styles.sectionText}>{branch.facility.title} - {branch.branch.name}</Text>
                  </View>
                )}
                renderItem={({item, section}) => (
                  <TouchableWithoutFeedback onPress={() => this.selectSimulatorRow(item, section)}>
                    <View style={styles.cellContentView1}>
                      <Text style={styles.nameText1}>{item.name}</Text>
                    </View>
                  </TouchableWithoutFeedback>
                )}  
              />
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalSelectSimulator}
          onRequestClose={() => {
            this.setState({ modalSelectSimulator: false, modalNewBranch: true });  
          }}
        >
          <View style={styles.centeredView2}>
            <View style={styles.titleView2}>
              <View style={{flex: 1}}/>
              <Text style={styles.editPText1}>Select Simulators</Text>
              <View style={{flex: 1}}/>
              <TouchableOpacity onPress={() => this.setState({modalSelectSimulator: false, modalNewBranch: true}) } style={styles.closeButton1}>
                <Image  style={styles.coloseImage1} source={require('../assets/images/account/icon_gclose.png')} />
              </TouchableOpacity>
            </View>    

            <FlatList
              data={this.state.originalSimulatorData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item, index}) => (  
                <TouchableOpacity style={styles.cellContentView} onPress={() => this.onTapSimulator(item)}>
                  <View style={{...styles.contentView, flexDirection: 'row'}}>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <View style={{flex: 1}}/>
                    {this.state.branchSimulators.includes(item.simulatorid) ? <Image source={require('../assets/images/message/check.png')} style={styles.checkmarkRead} /> : <View/>}  
                  </View>
                </TouchableOpacity>              
              )}
            /> 

            <View style={{flex:1}}/>
            <View style={styles.addButtonView}>
              <TouchableOpacity style={styles.loginButton} onPress={() => this.setState({modalNewBranch: true, modalSelectSimulator: false}) }>
                <Text style={styles.loginText}>Done</Text>
              </TouchableOpacity>
            </View>              
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalNewBranch}
          onRequestClose={() => {
            this.setState({ modalNewBranch: false });  
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {styles.modalView}>

              <View style={styles.titleView}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}>{this.state.isEditBranch ? 'Edit Branch' : 'New Branch'}</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity onPress={() => this.setState({ modalNewBranch: false }) } style={styles.closeButton}>
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={styles.firstNameText}>Branch Name</Text>
              <TextInput
                style={styles.emailInput}
                value={this.state.branchName}
                onChangeText={ (text) => this.setState({branchName: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
              />

              <Text style={{...styles.firstNameText, marginTop: 12}}>Branch Simulators</Text>
              <FlatList
                style={{maxHeight: 300}}
                data={this.state.branchSimulators}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (  
                  <View style={styles.cellContentView}>
                    <View style={{...styles.contentView, flexDirection: 'row'}}>
                      <Text style={styles.nameText}>{this.state.originalSimulatorData.filter(element => item == element.simulatorid)[0].name}</Text>
                    </View>
                  </View>              
                )}
              /> 

              <TouchableOpacity style={styles.addButton} onPress={() => this.setState({ modalNewBranch: false, modalSelectSimulator: true }) } >
                <Image style={{height: 25, width: 110}} source={require('../assets/images/survey/Addmore.png')}/>
              </TouchableOpacity>

              <View style={styles.addButtonView}>
                <TouchableOpacity style={styles.loginButton} onPress={() => this.onAddBranch()}>
                  <Text style={styles.loginText}>{this.state.isEditBranch ? 'Save' : 'Add'}</Text>
                </TouchableOpacity>
              </View>              
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalNewSimulator}
          onRequestClose={() => {
            this.setState({ modalNewSimulator: false }); 
          }}
        >
        <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {styles.modalView}>

              <View style={styles.titleView}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}> {this.state.isEditSimulator ? 'Edit Simulator' : 'New Simulator'}</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity onPress={() => this.setState({ modalNewSimulator: false })} style={styles.closeButton}>
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={styles.firstNameText}>Simulator Name</Text>
              <TextInput
                style={styles.emailInput}
                value={this.state.simulatorName}
                onChangeText={ (text) => this.setState({simulatorName: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
              />

              {/* <SelectDropdown
                data={arySNames}
                onSelect={(selectedItem, index) => {
                  this.setSimulatorProp('simulatorName', selectedItem)
                }}
                defaultButtonText={this.state.simulatorName && this.state.simulatorName != '' ? this.state.simulatorName : 'Select Simulator Name'}
                buttonTextAfterSelection={(selectedItem, index) => {
                  return selectedItem
                }}
                rowTextForSelection={(item, index) => {
                  return item
                }}
                buttonStyle={styles.emailInput}
                buttonTextStyle={styles.dropdownBtnTxtStyle}
                renderDropdownIcon={() => {
                  return (
                    <Image style={styles.image} source={ require('../assets/images/home/ChevronDown.png')} />
                  )
                }}
                dropdownIconPosition={'right'}
                // dropdownStyle={styles.dropdownDropdownStyle}
                // rowStyle={styles.dropdownRowStyle}
                rowTextStyle={styles.dropdownRowTxtStyle}
              /> */}

              <View>
                <Text style={styles.lastNameText}>Simulator Make</Text>
                <SelectDropdown
                  data={arySMakes}
                  onSelect={(selectedItem, index) => {
                    this.setSimulatorProp('simulatorMake', selectedItem)
                  }}
                  defaultButtonText={ this.state.simulatorMake && this.state.simulatorMake != '' ? this.state.simulatorMake : 'Select Simulator Make'}
                  buttonTextAfterSelection={(selectedItem, index) => {
                    return selectedItem
                  }}
                  rowTextForSelection={(item, index) => {
                    return item
                  }}
                  buttonStyle={styles.emailInput}
                  buttonTextStyle={styles.dropdownBtnTxtStyle}
                  renderDropdownIcon={() => {
                    return (
                      <Image style={styles.image} source={ require('../assets/images/home/ChevronDown.png')} />
                    )
                  }}
                  dropdownIconPosition={'right'}
                  rowTextStyle={styles.dropdownRowTxtStyle}
                />

                <Text style={styles.lastNameText}>Simulator Model</Text>
                <SelectDropdown
                  data={arySModels}
                  onSelect={(selectedItem, index) => {
                    this.setSimulatorProp('simulatorModel', selectedItem)
                  }}
                  defaultButtonText={this.state.simulatorModel && this.state.simulatorModel != '' ? this.state.simulatorModel : 'Select Simulator Model'}
                  buttonTextAfterSelection={(selectedItem, index) => {
                    return selectedItem
                  }}
                  rowTextForSelection={(item, index) => {
                    return item
                  }}
                  buttonStyle={styles.emailInput}
                  buttonTextStyle={styles.dropdownBtnTxtStyle}
                  renderDropdownIcon={() => {
                    return (
                      <Image style={styles.image} source={ require('../assets/images/home/ChevronDown.png')} />
                    )
                  }}
                  dropdownIconPosition={'right'}
                  rowTextStyle={styles.dropdownRowTxtStyle}
                />

                <Text style={styles.lastNameText}>Simulator Serial Number</Text>
                <TextInput
                  style={styles.emailInput}
                  value={this.state.simulatorSerial}
                  onChangeText={ (text) => this.setState({simulatorSerial: text}) }
                  autoCapitalize="none"
                  autoCompleteType="name"
                  textContentType="name"
                />

                {/* <SelectDropdown
                  data={arySSerials}
                  onSelect={(selectedItem, index) => {
                    this.setSimulatorProp('simulatorSerial', selectedItem)
                  }}
                  defaultButtonText={this.state.simulatorSerial && this.state.simulatorSerial != '' ? this.state.simulatorSerial : 'Select Simulator Serial'}
                  buttonTextAfterSelection={(selectedItem, index) => {
                    return selectedItem
                  }}
                  rowTextForSelection={(item, index) => {
                    return item
                  }}
                  buttonStyle={styles.emailInput}
                  buttonTextStyle={styles.dropdownBtnTxtStyle}
                  renderDropdownIcon={() => {
                    return (
                      <Image style={styles.image} source={ require('../assets/images/home/ChevronDown.png')} />
                    )
                  }}
                  dropdownIconPosition={'right'}
                  rowTextStyle={styles.dropdownRowTxtStyle}
                /> */}
              </View>

              <View style={styles.addButtonView}>
                <TouchableOpacity style={styles.loginButton} onPress={() => this.onAddSimulator()}>
                  <Text style={styles.loginText}>{this.state.isEditSimulator ? 'Save' : 'Add' }</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style = {styles.navigationView}> 
          <Text style={styles.header}>{this.state.facility.title}</Text>
          <BackButton goBack={() => this.props.navigation.goBack()} />

          {this.state.isAdmin && <TouchableOpacity style={styles.rightButton} onPress={() => this.onRight()} >
            <Image
              style={styles.rightImage}
              source={require('../assets/images/survey/Plus_yellow.png')}
            />
          </TouchableOpacity>
          }
        </View>

        <View style={styles.listView}>

          <View style={styles.facilityView}>              
            <Text style={styles.facilityText}>Facility Code</Text>   
            <View style={{flex: 1}}/>   
            <TouchableOpacity style={styles.generateButton} onPress={this.generateCode}>
              {this.state.facility.facilityCode ? 
                <View style={styles.codeView}>
                  <Text style={styles.codeText}>{this.state.facility.facilityCode}</Text> 
                  <View style={styles.arrowButton} >
                    <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
                  </View> 
                </View>
              : <Text style={styles.generateText}>Generate</Text> 
              }
            </TouchableOpacity>
          </View>  

          <TouchableOpacity style={{...styles.facilityView, marginTop: 6}} onPress={this.onTimeZone}>  
            { this.state.facility.timezone ? 
              <Text style={{...styles.facilityText, maxWidth: DEVICE_WIDTH - 85}}>{this.state.facility.timezone.label}</Text> :
              <Text style={styles.timezoneText}>Set Timezone</Text> 
            }   
            <View style={{flex: 1}}/>   
            <View style={styles.arrowButton} >
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View> 
          </TouchableOpacity>  

          <SegmentedControl
            style={styles.segementContainer}
            values={[
              'Employees',
              'Branches',
              'Simulators',
            ]}
            selectedIndex={this.state.segementIndex}
            onChange={(event) => {
              this.setState({segementIndex: event.nativeEvent.selectedSegmentIndex});
            }}
            fontStyle={{fontSize: 14, fontFamily: 'Poppins-SemiBold'}}
          />

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

          {this.state.segementIndex == 0 ? 
           <FlatList
            contentContainerStyle={{ paddingBottom: 24 }}
            data={this.state.filteredUserData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => (            
              <View style={styles.cellContentView}>
                <Swipeable
                  renderRightActions={this.leftUserAction}
                  onSwipeableRightOpen={() => this.setState({selectedUser: item}) }
                >
                  <View style={styles.contentEView}>
                    <TouchableOpacity style={styles.contentEPView } onPress={() => this.modalUser(item)}>                    
                      <View style={styles.profileImageView}>
                        {item.image && item.image != '' ? <Image source={{uri : item.image}} style={styles.profileImage} /> : <Image style={styles.profileImage} source={require('../assets/images/home/iconUser.png')}/>}
                      </View>
                      <Text style={styles.nameText}>{item.firstname + " " + item.lastname}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style = {styles.downButton1} onPress={() => this.expandOnUser(item)}>
                      <Image source={ item.expand == false ? require('../assets/images/home/ChevronDown.png') : require('../assets/images/home/ChevronUp.png')} style={styles.image} />
                    </TouchableOpacity>  
                  </View>
                  {item.expand == false ? 
                    <View /> : 
                    <View style={{marginLeft: 66, marginRight: 16, marginBottom: 12}}>
                      <Text style={styles.emailText}>{item.email}</Text> 
                      <View style={{height: 1,backgroundColor: theme.colors.lineColor}}/>
                      <View style={{flexDirection: 'row'}}>
                        <Text style={styles.dataTitleText}>Branches</Text> 
                        <View style={{flex: 1}}/>
                        <Text style={styles.dataTitleText}>Access</Text> 
                      </View>

                      {item.facility.length > 0 && item.facility.map((facilityData, index) =>  (
                        <View style={{flexDirection: 'row'}} key={index}>
                          <Text style={styles.dataText}>{facilityData.branch}</Text> 
                          <View style={{flex: 1}}/>
                          <Text style={styles.dataText}>{facilityData.access}</Text> 
                        </View>
                        )
                      )} 
                    </View>
                  }

                </Swipeable>
              </View>             
              )}
            />
          : this.state.segementIndex == 1 ?  
            <FlatList
              contentContainerStyle={{ paddingBottom: 24 }}
              data={this.state.filteredBranchData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item, index}) => (  
                <TouchableOpacity onPress={() => this.onSelectEditBranch(item)} style={styles.cellContentView}>
                  <Swipeable
                    renderRightActions={this.leftBranchAction}
                    onSwipeableRightOpen={() => this.setState({selectedBranch: item}) }
                  >
                    <View style={styles.contentView}>
                      <Text style={styles.nameText}>{item.name}</Text>   
                      <View style={styles.contentBView}>
                        <Text style={styles.simulatorText}>{ !item.simulators ? '0 Simulator' : item.simulators.length < 2 ? item.simulators.length + ' Simulator' : item.simulators.length + ' Simulators' }</Text> 
                        <Text style={styles.employeeText}>  *  </Text>
                        <Text style={styles.simulatorText}>{item.employees.length < 2 ? item.employees.length + ' Employee' : item.employees.length + ' Employees'}</Text>   
                      </View>                               
                    </View>
                  </Swipeable>
                </TouchableOpacity>            
              )}
            />
          : this.state.filteredData.length > 0 ? 
            <SectionList
              sections={this.state.filteredData}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyExtractor={(item, index) => item + index} 
              renderSectionHeader={({ section: {branch} }) => (
                <View style = {styles.sectionView}>
                  <Text style={styles.facilityText}>{branch.name}</Text>
                </View>
              )}         
              renderItem={({item, section}) => (            
                <TouchableOpacity onPress={() => this.onSelectEditSimulator(item)} style={styles.cellContentView}>
                  <Swipeable
                    renderRightActions={this.leftSimulatorAction}
                    onSwipeableRightOpen={() => this.setState({
                      selectedSimulator: item,
                      relatedBranch: section
                    })}
                  >
                    <View style={styles.contentView}>
                      <Text style={styles.nameText}>{item.name}</Text>   
                      {item.expand == false ? 
                        <View/> :  
                        <View>
                          {item.make ? <Text style={styles.dataText}>{item.make}</Text> : <View/>}
                          {item.name ? <Text style={styles.dataText}>{item.model}</Text> : <View/>}
                          {item.serial ? <Text style={styles.dataText}>{item.serial}</Text> : <View/>}
                        </View>
                      }
                      
                      <TouchableOpacity style = {styles.downButton} onPress={() => this.expandOnSimulator(item, section)}>
                        <Image source={ item.expand == false ? require('../assets/images/home/ChevronDown.png') : require('../assets/images/home/ChevronUp.png')} style={styles.image} />
                      </TouchableOpacity>                                    
                    </View>
                  </Swipeable>
                </TouchableOpacity>             
              )}
            />
          : <View/> 
          }              
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

  header: {
    height: 44,
    minHeight: 28,
    maxWidth: DEVICE_WIDTH - 100,
    position: 'absolute',
    bottom: 0,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    textAlign: 'center'    
  },

  facilityView: {
    width: DEVICE_WIDTH - 32,
    height: 42,  
    marginTop: 16,  
    marginBottom: 6, 
    marginLeft: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center'
  },

  facilityText: {
    marginTop: 4,
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.darkGray,
  },

  generateButton: {
    height: 38,
    marginRight: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  codeView: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  }, 

  codeText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',  
    color: theme.colors.primary,
  },

  timezoneText: {
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
    color: theme.colors.primary,
  },

  arrowButton: {
    width: 20,
    height: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  arrowImage: {
    width: 9,
    height: 14.4,
    tintColor: theme.colors.primary
  },

  generateText: {
    marginRight: 10,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',  
    color: theme.colors.primary,
    textDecorationLine: 'underline'   
  },

  searchView: {
    width: DEVICE_WIDTH - 32,
    height: 36,  
    marginTop: 8,  
    marginBottom: 8, 
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
  },

  contentBView: {
    flex: 1,
    marginTop: 3,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexDirection: 'row',
  },  

  employeeText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.darkGray,  
  },

  contentEView: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  contentEPView: {
    flex: 1,
    marginRight: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  nameView: {
    marginLeft: 1,
    flexDirection: 'row',
  },

  nameText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',     
  },

  simulatorText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.darkGray,    
  },

  timeText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray,    
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

  centeredView2: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: 'white'
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

  titleView2: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignItems: 'flex-end',
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  editPText1: {
    marginBottom: 16,
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

  closeButton1: {
    width: 60, 
    height: 60, 
    position: 'absolute',
    right: 10,
    bottom: 0,
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

  coloseImage1: {
    position: 'absolute',
    top: 19,
    right: 9,
    width: 22,
    height: 22,
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
  },    

  dropdownBtnTxtStyle: {
    textAlign: 'left',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  dropdownRowTxtStyle: {
    textAlign: 'left',
    marginLeft: 24,
    fontSize: 15,
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

  downButton: { 
    height: 40,
    width: 60,
    position: 'absolute',
    right: -8,
    top: -2,
    paddingTop: 11,
    alignItems: 'center', 
    alignSelf: 'center',
  },

  downButton1: { 
    height: 40,
    width: 60,
    position: 'absolute',
    right: -8,
    top: -2,
    paddingTop: 16,
    alignItems: 'center', 
    alignSelf: 'center',
  },

  image: {
    height: 8.33,
    width: 14.23,    
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  dataTitleText:{
    marginTop: 10,
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.lightGray,
  },

  emailText:{
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.darkGray,
  },

  dataText:{
    marginTop: 10,
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.darkGray,
  },

  sectionView: {
    width: DEVICE_WIDTH,
    height: 36,
    backgroundColor: 'white',
  },

  sectionText: {    
    paddingLeft: 16,
    paddingTop: 6,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
  },

  profileImageView: {    
    width: 40,
    height: 40,
    marginLeft: 0,    
    marginRight: 16,
    borderRadius: 20,
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
    width: 40,
    height: 40,
    
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },  

  segementContainer: {
    height: 32,
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 10,
  },

  addButtonView: {
    backgroundColor: theme.colors.inputBack, 
    width: DEVICE_WIDTH, 
    alignItems: 'center', 
    marginTop: 32, 
    marginBottom: 0
  },

  checkmarkRead: {
    marginTop: 4, 
    marginRight: 8,
    width: 16,
    height: 12,
    resizeMode: 'cover',
    tintColor: theme.colors.darkBlue,
  },

  selectText:{
    marginTop: 12,
    paddingLeft: 16,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
  },

  supportView: {
    width: '100%',
    height: 58,
    paddingHorizontal: 12,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection : 'row',
},

  titleView1 : {    
    width: DEVICE_WIDTH,
    height: 72,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    flexDirection: 'row',
    borderBottomColor: theme.colors.inputBar,
    borderBottomWidth: 1,     
  },

  pleaseText:{
    marginTop: 24,
    paddingLeft: 16,
    fontSize: 14,
    lineHeight: 26,
    fontFamily: 'Poppins-Regular', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  simulatorView:{
    marginTop: 12,
    paddingLeft: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },

  cellSelectedContentView: {
    height: 42,
    width: (DEVICE_WIDTH - 24 - 24)/3,
    marginHorizontal: 4,
    marginVertical: 8,
    paddingTop: 2,
    borderRadius: 21,           
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    flexDirection: 'row',
    elevation: 18,

    shadowColor: theme.colors.shadow,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
  },

  cellUnSelectContentView: {
    height: 42,
    width: (DEVICE_WIDTH - 24 - 24)/3,
    marginHorizontal: 4,
    marginVertical: 8,
    paddingTop: 2,
    borderRadius: 21,   
    borderColor: theme.colors.supportBorder,       
    borderWidth:  1,    
    alignItems: 'center',
    justifyContent: 'center',        
    flexDirection: 'row',
  },

  callImage: {
    width: 24,
    height: 24,        
    resizeMode: 'stretch'
  },

  callText: {
    marginLeft: 4,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular', 
  },

  simulatorButton: {
    height: 44,
    width: DEVICE_WIDTH - 32,
    marginHorizontal: 16,
    marginTop: 8,
    paddingTop: 2,
    
    borderRadius: 10,
    backgroundColor: '#F2F2F2',

    alignItems: 'center',
    justifyContent: 'center',      
    flexDirection: 'row',    
  }, 

  simulatorText: {
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',      
  },

  nonsimulatorText: {
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',   
    color: theme.colors.lightGray,  
  },

  chevronImage: {
    marginRight: 16,
    width: 10.5,
    height: 18,
  }, 

  countText:{
    marginTop: 12,
    marginRight: 16,
    paddingLeft: 16,
    fontSize: 18,
    lineHeight: 30,
    
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  emailInput1: {
    width: DEVICE_WIDTH - 32,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,    

    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },  

  searchView1: {
    width: DEVICE_WIDTH - 32,
    height: 45,    
    marginTop: 14,
    borderRadius: 22.5,    
    backgroundColor: theme.colors.inputBar,
  },

  searchInput1:{
    flex: 1,
    marginLeft: 14,
  },

  listView1: {
    flex: 1,
    marginTop: 8,  
  },

  cellContentView1: {    
    flex: 1,
    width: DEVICE_WIDTH - 32,
    height: 45,
    marginTop: 6,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',

  },

  nameText1: {
    marginLeft: 12,
    marginTop: 14,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',     
  },

}) 


const mapStateToProps = ({ auth, users, chat }, { exclude = [] }) => ({
  data: users
    .users
    .filter(user => auth.user ? user.id !== auth.user.id : true)
    .filter(user => exclude.indexOf(user.id) === -1),
  selected: users.selected,
  connected: chat.connected,
  loading: chat.loading,
  currentUser: auth.user,
  users: users.users,
})

const mapDispatchToProps = {
  getUsers: usersGet,
  selectUser: usersSelect,
  call: webrtcCall,
  selectCUser: usersChatSelect,
  cancel: dialogCreateCancel,
  createDialog: dialogCreate,
  sendMessage: messageSend,
}

export default connect(mapStateToProps, mapDispatchToProps)(FacilitySimulators)