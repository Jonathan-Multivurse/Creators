import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, StyleSheet, Image, Dimensions, Text,  Platform, FlatList, TouchableOpacity, ActivityIndicator, Alert} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import SupportItem from '../components/SupportItem'
import { theme } from '../core/theme'
import firestore from '@react-native-firebase/firestore'
import {firebase} from '@react-native-firebase/auth'
import moment from 'moment'
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import { showError } from '../NotificationService'
import { 
  usersGet,
  usersChatSelect,
  dialogCreate, 
  dialogJoin,
  dialogCreateCancel, 
  messageSend,
  usersSelect,
  webrtcCall
 } from '../actionCreators'
 import QB from 'quickblox-react-native-sdk'

const DEVICE_WIDTH = Dimensions.get('window').width

class SupportScreen extends Component {
  constructor(props) {
    super(props)

    this._unsubscribeFocus = null;
    this._observer = null;

    this.state = { 
      isLoading: false,
      segementIndex: 0,

      supports: [],
      scheduledSupports: [],
      activeSupports: [],
      closedSupports: [], 
    }
  }

  componentDidMount() {
    // this.massDeleteDocs()
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getSupports();
    });

    const userID = firebase.auth().currentUser.uid;
    this._observer = firestore().collection('notification').where('receivers', 'array-contains', userID)
    .onSnapshot(querySnapshot => {
      if (querySnapshot.docChanges().length > 0){
        this.getSupports();
      }      
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
    this._observer();
  }

  massDeleteDocs = async() => {
    // const notificationQuerySnapshot = 
    // await firestore()
    // .collection('facility')
    // .where('title', 'not-in', ['Charleston WV', 'AirMethods', 'SIMNE', 'iEXCEL', 'TSQC', 'CON'])
    // .get();

    // const batch = firestore().batch();

    // notificationQuerySnapshot.forEach(documentSnapshot => {     
    //   var simulators =  documentSnapshot.data().simulators
    //   var tmpSimulators = []
    //   if (simulators.length > 0) {
    //     simulators.forEach((simulator) => {
    //       var code = '';
    //       var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    //       var charactersLength = characters.length;
    //       for ( var i = 0; i < 7; i++ ) {
    //         code += characters.charAt(Math.floor(Math.random() * charactersLength));
    //       }

    //       var tmpSimulator = simulator
    //       tmpSimulator.simulatorid = code
    //       tmpSimulators.push(tmpSimulator)  
    //     })
    //   }
    //   batch.update(documentSnapshot.ref, 'simulators', tmpSimulators);
    // });
  
    // return batch.commit();

    const facilites = [
      {"branch": [{"branchid": "I3SV4ZY", "name": "AHU Denver", "simulators": ["YRT63"]}], "date": 1648650336256, "facilityCode": "WVMU7", "facilityid": "dzpLj0Jz21EAfhjioEiY", "simulators": [{"make": "Laerdal", "model": "", "name": "SimMan3G", "serial": "", "simulatorid": "YRT63"}], "title": "AdventHealth - Denver"},
      {"branch": [{"branchid": "LHKB8WP", "name": "Lincoin", "simulators": ["6Q9VDPO", "JIKT9BR", "HOSW9WL", "5M6G9RC", "DP33Q34"]}], "date": 1632450377089, "facilityCode": "U1PVA", "facilityid": "Adiw87TLVuq6wAMuKzQR", "sharedEmails": [], "simulators": [{"make": "CAE", "model": "S901", "name": "iStan", "serial": "iStan986", "simulatorid": "DP33Q34"}, {"make": "Gaumard", "model": "AirSim Combo X", "name": "Noelle", "serial": "N1207188", "simulatorid": "JIKT9BR"}, {"make": "Gaumard", "model": "Newborn HAL", "name": "Newborn HAL", "serial": "B1204206", "simulatorid": "6Q9VDPO"}, {"make": "CAE ", "model": "CentraLineMan", "name": "Pediatric HAL 5 Y/O", "serial": "220-01001", "simulatorid": "HOSW9WL"}, {"make": "CAE", "model": "METIman", "name": "METIman Nursing", "serial": "MMN0402", "simulatorid": "5M6G9RC"}, {"make": "Laerdal", "model": "FemoraLineMan", "name": "METIman", "serial": "220-01001", "simulatorid": "FGNOH"}], "timezone": {"label": "Eastern Standard Time (GMT-05:00)", "name": "(GMT-05:00) Eastern Time (US and Canada)", "tzCode": "America/New_York", "utc": "-05:00"}, "title": "Anderson"},
      {"branch": [{"branchid": "9eTCG", "name": "Chaminade", "simulators": ["7OF5U4R", "DAJMPQF", "UYO6Q", "KP24A", "DCVNT", "8T48U"]}], "date": 1632448445685, "facilityCode": "KASP1", "facilityid": "06zIMf1QKKzkYaDQwYis", "simulators": [{"make": "CAE", "model": "CentraLineMan", "name": "iStan", "serial": "87654321", "simulatorid": "7OF5U4R"}, {"make": "Gaumard ", "model": "Sample model", "name": "PediaSIM", "serial": "", "simulatorid": "DAJMPQF"}, {"make": "CAE", "model": "", "name": "METIman", "serial": "", "simulatorid": "UYO6Q"}, {"make": "CAE", "model": "", "name": "BabySIM", "serial": "", "simulatorid": "KP24A"}, {"make": "Gaumard", "model": "", "name": "Noelle", "serial": "", "simulatorid": "DCVNT"}, {"make": "Laerdal", "model": "", "name": "VitalSim", "serial": "", "simulatorid": "8T48U"}], "timezone": {"label": "SA Eastern Standard Time (GMT-03:00)", "name": "(GMT-03:00) Buenos Aires, Georgetown", "tzCode": "America/Argentina/Buenos_Aires", "utc": "-03:00"}, "title": "Chaminade"},
      {"branch": [{"branchid": "1VeBT", "name": "UCWV", "simulators": ["1ZVBT", "VbeR5", "VZ1Va", "EFS3M", "GQ4QM", "43IBG", "LNB9V", "UFIMJ", "C4A4H"]}], "date": 1632451709345, "facilityCode": "BVPB2", "facilityid": "1EVkyZFbljVSaVeBRM5T", "simulators": [{"make": "CAE", "model": "JUNO Version 1.3 JNE (94)", "name": "JUNO Version 1.3 JNE (94)", "serial": "", "simulatorid": "1ZVBT"}, {"make": "Gaumard ", "model": "AirSim Combo X", "name": "Noell Version 2.44.0.0 Firmware 7.51", "serial": "", "simulatorid": "EFS3M"}, {"make": "Gaumard ", "model": "NewBorn Tory Version 2.44.0.0", "name": "NewBorn Tory Version 2.44.0.0", "serial": "", "simulatorid": "VbeR5"}, {"make": "Laerdal ", "model": "3G Version 7.0.0.4777", "name": "3G Version 7.0.0.4777", "serial": "", "simulatorid": "VZ1Va"}, {"make": "Laerdal ", "model": "SimNewB Advanced", "name": "SimNewB Advanced", "serial": "220-01001", "simulatorid": "2VyFj"}, {"make": "Laerdal", "model": "", "name": "SimMom", "serial": "", "simulatorid": "GQ4QM"}, {"make": "Laerdal", "model": "", "name": "SimNewB Classic", "serial": "", "simulatorid": "43IBG"}, {"make": "CAE", "model": "", "name": "Ares", "serial": "", "simulatorid": "LNB9V"}, {"make": "Laerdal", "model": "", "name": "SimBaby Classic", "serial": "", "simulatorid": "UFIMJ"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "", "simulatorid": "C4A4H"}], "timezone": {"label": "US Eastern Standard Time (GMT-05:00)", "name": "(GMT-05:00) Indiana (East)", "tzCode": "America/Indiana/Indianapolis", "utc": "-05:00"}, "title": "Charleston WV"},
      {"branch": [{"branchid": "9GASTD", "name": "Chesapeake College", "simulators": ["YLPQA8W", "NB42FVW", "WJP0UXG", "6638RCX", "ATYBRM8", "ITR7EQW", "ICO1BST", "11M5RQC", "R8YBHEQ", "ZI5H9", "RONPF", "VIT2K"]}], "date": 1632450232601, "facilityCode": "Q7U3Q", "facilityid": "INwcudH36o7WqMex5Pv9", "simulators": [{"make": "CAE", "model": "sample model", "name": "Lucina", "serial": "87654321", "simulatorid": "YLPQA8W"}, {"make": "CAE", "model": "METIman", "name": "METIman", "serial": "", "simulatorid": "NB42FVW"}, {"make": "CAE", "model": "PediaSIM", "name": "PediaSIM", "serial": "", "simulatorid": "WJP0UXG"}, {"make": "CAE", "model": "BabySIM", "name": "BabySIM", "serial": "", "simulatorid": "6638RCX"}, {"make": "CAE", "model": "iStan", "name": "iStan", "serial": "", "simulatorid": "ATYBRM8"}, {"make": "CAE", "model": "PediaSIM", "name": "PediaSIM", "serial": "", "simulatorid": "ITR7EQW"}, {"make": "Laerdal", "model": "SimNewB Classic", "name": "SimNewB Classic", "serial": "", "simulatorid": "ICO1BST"}, {"make": "Laerdal", "model": "MegaCode Kelly", "name": "MegaCode Kelly", "serial": "", "simulatorid": "11M5RQC"}, {"make": "Laerdal", "model": "ALS Simulator", "name": "ALS Simulator", "serial": "", "simulatorid": "R8YBHEQ"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "ZI5H9"}, {"make": "CAE", "model": "", "name": "METIman", "serial": "", "simulatorid": "RONPF"}, {"make": "CAE", "model": "", "name": "METIman", "serial": "", "simulatorid": "VIT2K"}], "title": "Chesapeake College"},
      {"branch": [{"branchid": "1eM5T", "name": "Branch1", "simulators": []}, {"branchid": "1VeBT", "name": "Branch2", "simulators": []}, {"branchid": "eRM5T", "name": "Branch3", "simulators": []}], "date": 1642172904819, "facilityCode": "CU7WE", "facilityid": "hqpsJuNaLEvsK3QSjud7", "simulators": [{"make": "", "model": "Lifecast Adult", "name": "Lifecast Adult", "serial": "", "simulatorid": "A1KTXYW"}, {"make": "", "model": "Laerdal SimMan3G", "name": "Laerdal SimMan3G", "serial": "", "simulatorid": "XI69O67"}, {"make": "", "model": "CAE Apollo", "name": "CAE Apollo", "serial": "", "simulatorid": "NASCB7T"}, {"make": "", "model": "Gaumard Noelle", "name": "Gaumard Noelle", "serial": "", "simulatorid": "A1JF3XF"}], "timezone": {"label": "Eastern Standard Time (GMT-05:00)", "name": "(GMT-05:00) Eastern Time (US and Canada)", "tzCode": "America/New_York", "utc": "-05:00"}, "title": "Echo Healthcare"},
      {"branch": [{"branchid": "KPMXV3L", "name": "Main", "simulators": ["F77H5", "V5STA", "ER25H"]}], "date": 1650915378942, "facilityCode": "9RNE8", "facilityid": "dQTehoLbcGaZtRfbWSkb", "simulators": [{"make": "CAE", "model": "", "name": "Apollo", "serial": "", "simulatorid": "F77H5"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "", "simulatorid": "V5STA"}, {"make": "CAE", "model": "", "name": "Luna Advanced", "serial": "", "simulatorid": "ER25H"}], "title": "Fleming College"},
      {"branch": [{"branchid": "1eM5T", "name": "Baltimore Medical Center", "simulators": ["9011SI6", "DMFL38O", "ZUTI796", "0Q7QH93"]}], "date": 1632450725437, "facilityCode": "LSX79", "facilityid": "1SqLEh3HTB1rVyzC6MSF", "simulators": [{"make": "Laerdal", "model": "SimNewB Classic", "name": "SimNewB Classic", "serial": "", "simulatorid": "9011SI6"}, {"make": "Laerdal", "model": "SimMan3G", "name": "SimMan3G", "serial": "", "simulatorid": "DMFL38O"}, {"make": "Laerdal", "model": "SimMom", "name": "SimMom", "serial": "", "simulatorid": "ZUTI796"}, {"make": "Laerdal", "model": "SimJunior", "name": "SimJunior", "serial": "", "simulatorid": "0Q7QH93"}], "title": "Greater Baltimore Medical Center"},
      {"branch": [{"branchid": "1eM5T", "name": "Gundersen", "simulators": ["38SR316", "XU35D", "1Z3KE", "7JNGS"]}], "date": 1632449135443, "facilityCode": "8DTGT", "facilityid": "pwi9BDVstpnl5LOVW2dg", "simulators": [{"make": "CAE", "model": "iStan", "name": "iStan", "serial": "", "simulatorid": "38SR316"}, {"make": "CAE", "model": "", "name": "Ares", "serial": "", "simulatorid": "XU35D"}, {"make": "CAE", "model": "", "name": "Ares", "serial": "ARE000515", "simulatorid": "1Z3KE"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "951", "simulatorid": "7JNGS"}], "timezone": {"label": "Central Standard Time (GMT-06:00)", "name": "(GMT-06:00) Central Time (US and Canada)", "tzCode": "America/Chicago", "utc": "-06:00"}, "title": "Gundersen"},
      {"branch": [{"branchid": "PAP5ZUW", "name": "Health Sciences North", "simulators": ["HK56T"]}], "date": 1649880715663, "facilityCode": "M6C6M", "facilityid": "2EBGHmm8DDOi3MB3D8Pz", "simulators": [{"make": "Laerdal", "model": "", "name": "SimMan 3G", "serial": "", "simulatorid": "HK56T"}], "title": "Health Sciences North"},
      {"branch": [{"branchid": "1eM5T", "name": "High Point University", "simulators": ["N21LZUW", "8QA8LRY", "DNVKN6A"]}], "date": 1632452899627, "facilityCode": "8VZIM", "facilityid": "oof7oPmnFmz8LjKyxO4p", "simulators": [{"make": "CAE ", "model": "iStan", "name": "iStan", "serial": "", "simulatorid": "DNVKN6A"}, {"make": "CAE", "model": "HPS", "name": "HPS", "serial": "", "simulatorid": "N21LZUW"}, {"make": "Laerdal ", "model": "Harvey", "name": "Harvey", "serial": "", "simulatorid": "8QA8LRY"}], "title": "High Point University"},
      {"branch": [{"branchid": "1eM5T", "name": "Husson University", "simulators": ["9K8JZTD", "IDVHY5N", "3Z8FVG6", "0OBH2YP", "XW63XCX", "U7WSFPS", "V1MC9", "1QTQN"]}], "date": 1632451226899, "facilityCode": "3NGZZ", "facilityid": "SV1dsEybSSoh64BFUdQ1", "simulators": [{"make": "Laerdal", "model": "SimMan Essential", "name": "SimMan Essential", "serial": "", "simulatorid": "9K8JZTD"}, {"make": "Laerdal", "model": "SimNewB", "name": "SimNewB", "serial": "", "simulatorid": "IDVHY5N"}, {"make": "Laerdal", "model": "Nursing Anne Simulator", "name": "Nursing Anne Simulator", "serial": "", "simulatorid": "3Z8FVG6"}, {"make": "CAE", "model": "Juno", "name": "Juno", "serial": "", "simulatorid": "0OBH2YP"}, {"make": "Laerdal", "model": "SimMom", "name": "SimMom", "serial": "", "simulatorid": "XW63XCX"}, {"make": "Laerdal", "model": "SimJunior", "name": "SimJunior", "serial": "", "simulatorid": "U7WSFPS"}, {"make": "Laerdal", "model": "", "name": "SimMan3G", "serial": "", "simulatorid": "V1MC9"}, {"make": "CAE", "model": "", "name": "LearningSpace", "serial": "", "simulatorid": "1QTQN"}], "timezone": {"label": "Eastern Standard Time (GMT-05:00)", "name": "(GMT-05:00) Eastern Time (US and Canada)", "tzCode": "America/New_York", "utc": "-05:00"}, "title": "Husson"},
      {"branch": [{"branchid": "1VeBT", "name": "Icahn SOM (Main)", "simulators": ["JAVX1F9"]}], "date": 1632447622215, "facilityCode": "8W548", "facilityid": "21X1TKhEkRXErzEkyUeA", "simulators": [{"make": "CAE", "model": "HPS", "name": "HPS", "serial": "", "simulatorid": "JAVX1F9"}], "title": "Icahn SOM"},
      {"branch": [{"branchid": "0HSDB", "name": "UNMC-DGC", "simulators": ["9PDDGP", "3PDSFB", "9IIDSB", "0PBCBC", "4QBBSD", "9BAPJE", "6VXCVV", "83SAGB", "0BVBCJ", "3BGBCK", "9NCUDD", "0BGBSB"]}], "date": 1646015906835, "facilityCode": "ZC26V", "facilityid": "DUYLf9yHnz101UNNqcSK", "simulators": [{"make": "CAE", "model": "", "name": "Apollo", "serial": "APP0202", "simulatorid": "9PDDGP"}, {"make": "Gaumard", "model": "S2225", "name": "Advanced Pediatric HAL", "serial": "X1902116", "simulatorid": "3PDSFB"}, {"make": "Gaumard", "model": "S2209", "name": "Premie HAL", "serial": "P7812036", "simulatorid": "9IIDSB"}, {"make": "Gaumard", "model": "S3000", "name": "Adult HAL 3000 (Dark)", "serial": "H1908031", "simulatorid": "0PBCBC"}, {"make": "Gaumard", "model": "S3000", "name": "Adult HAL 3000 (Light)", "serial": "H1908032", "simulatorid": "4QBBSD"}, {"make": "Gaumard", "model": "S3201", "name": "Adult HAL 3201", "serial": "H1805737", "simulatorid": "9BAPJE"}, {"make": "Gaumard", "model": "S2210", "name": "Newborn Tory", "serial": "B5908494", "simulatorid": "6VXCVV"}, {"make": "Gaumard", "model": "S575.100", "name": "Noelle", "serial": "Q1909628", "simulatorid": "83SAGB"}, {"make": "Gaumard", "model": "S3004", "name": "Pedi HAL S3004 1 YO", "serial": "O1811525", "simulatorid": "0BVBCJ"}, {"make": "Gaumard", "model": "S2200", "name": "SuperTory S2220", "serial": "W1805156", "simulatorid": "3BGBCK"}, {"make": "Gaumard", "model": "S3040.50", "name": "Trauma Hal", "serial": "K7910045", "simulatorid": "9NCUDD"}, {"make": "Laerdal", "model": "", "name": "Laerdal Nursing Anne", "serial": "320UMM3518047", "simulatorid": "0BGBSB"}], "title": "iEXCEL"},
      {"branch": [{"branchid": "1eM5T", "name": "InSytu Simulation", "simulators": ["FASY2DO", "66H1MSS", "13KMHQ9", "594J4XR", "LK8AVY1"]}], "date": 1632447296730, "facilityCode": "CROV1", "facilityid": "SnSeedAH1SWiLaTUmfbs", "simulators": [{"make": "Laerdal", "model": "SimMan 3G", "name": "SimMan 3G", "serial": "", "simulatorid": "FASY2DO"}, {"make": "Laerdal", "model": "SimJunior", "name": "SimJunior", "serial": "", "simulatorid": "66H1MSS"}, {"make": "Laerdal", "model": "SimNewB", "name": "SimNewB", "serial": "", "simulatorid": "13KMHQ9"}, {"make": "Laerdal", "model": "SimBaby", "name": "SimBaby", "serial": "", "simulatorid": "594J4XR"}, {"make": "Gaumard", "model": "Noelle", "name": "Noelle", "serial": "", "simulatorid": "LK8AVY1"}], "title": "InSytu Simulation"},
      {"branch": [{"branchid": "1eM5T", "name": "NRGH", "simulators": ["PJP6Z1W", "ZO7MBJK", "BTHI761", "PKPVYBC", "WBXJ2H4", "MK7TAKI", "GHDNTRQ", "AK3YSI1", "6IRE21V", "KAS02DY", "FXQI4P5", "9OC3REN"]}], "date": 1643048291942, "facilityCode": "DE12Y", "facilityid": "rfXBmYEAKgAmbHRFRGj7", "sharedEmails": ["darin.abbey@viha.ca", "darin.abbey@islandhealth.ca"], "simulators": [{"make": "", "model": "QCPR", "name": "QCPR", "serial": "", "simulatorid": "PJP6Z1W"}, {"make": "", "model": "QCPR", "name": "QCPR", "serial": "", "simulatorid": "ZO7MBJK"}, {"make": "", "model": "QCPR", "name": "QCPR", "serial": "", "simulatorid": "BTHI761"}, {"make": "", "model": "QCPR", "name": "QCPR", "serial": "", "simulatorid": "PKPVYBC"}, {"make": "", "model": "QCPR Child", "name": "QCPR Child", "serial": "", "simulatorid": "WBXJ2H4"}, {"make": "", "model": "QCPR Child", "name": "QCPR Child", "serial": "", "simulatorid": "MK7TAKI"}, {"make": "Laerdal", "model": "SimMan Essential", "name": "SimMan Essential", "serial": "", "simulatorid": "GHDNTRQ"}, {"make": "Laerdal", "model": "MegaCode Kid", "name": "MegaCode Kid", "serial": "", "simulatorid": "AK3YSI1"}, {"make": "Laerdal", "model": "SimBaby", "name": "SimBaby", "serial": "", "simulatorid": "6IRE21V"}, {"make": "Laerdal", "model": "SimNewB", "name": "SimNewB", "serial": "", "simulatorid": "KAS02DY"}, {"make": "Laerdal", "model": "SimJunior", "name": "SimJunior", "serial": "", "simulatorid": "FXQI4P5"}, {"make": "Simulab", "model": "CentraLineMan", "name": "CentraLineMan", "serial": "", "simulatorid": "9OC3REN"}, {"make": "Simulab", "model": "FemoraLineMan", "name": "FemoralLineMan", "serial": "", "simulatorid": "H9TIYBD"}], "timezone": {"label": "Pacific Standard Time (GMT-08:00)", "name": "(GMT-08:00) Pacific Time (US and Canada); Tijuana", "tzCode": "America/Tijuana", "utc": "-08:00"}, "title": "Island Health - NRGH"},
      {"branch": [{"branchid": "1eM5T", "name": "John Abbott College", "simulators": ["NG5BV1D", "41KR0GX"]}], "date": 1632447543127, "facilityCode": "IVD5D", "facilityid": "zL3aKbW6mXbAXCr5YJJh", "simulators": [{"make": "Gaumard", "model": "Pediatric Hal 5 Y/O", "name": "Pediatric Hal 5 Y/O", "serial": "", "simulatorid": "NG5BV1D"}, {"make": "Gaumard", "model": "Newborn HAL", "name": "Newborn HAL", "serial": "", "simulatorid": "41KR0GX"}], "title": "John Abbott College"},
      {"branch": [{"branchid": "1eM5T", "name": "Kishwaukee", "simulators": ["IX0CD", "ARKS6", "44PDS", "ATIE8"]}], "date": 1632452731448, "facilityCode": "138CY", "facilityid": "5MqGaPaoviVaoB7ZKAHm", "simulators": [{"make": "CAE", "model": "", "name": "SimMan 3G", "serial": "", "simulatorid": "GK06Q"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "IX0CD"}, {"make": "CAE", "model": "", "name": "Apollo", "serial": "", "simulatorid": "ARKS6"}, {"make": "CAE", "model": "", "name": "BabySim", "serial": "", "simulatorid": "44PDS"}, {"make": "CAE", "model": "", "name": "PediaSim", "serial": "", "simulatorid": "ATIE8"}], "title": "Kishwaukee"},
      {"branch": [{"branchid": "1eM5T", "name": "Lake Forest Hospital", "simulators": ["5JR01D9", "NESPBDU", "MLJ4FBM"]}], "date": 1632450825067, "facilityCode": "NL8MX", "facilityid": "QSXkz4XnJ9kAzSglIDml", "simulators": [{"make": "Laerdal", "model": "SimJunior", "name": "SimJunior", "serial": "", "simulatorid": "5JR01D9"}, {"make": "Laerdal", "model": "SimMom", "name": "SimMom", "serial": "", "simulatorid": "NESPBDU"}, {"make": "Laerdal", "model": "SimMan Essential", "name": "SimMan Essential", "serial": "", "simulatorid": "MLJ4FBM"}], "timezone": {"label": "Central Standard Time (GMT-06:00)", "name": "(GMT-06:00) Central Time (US and Canada)", "tzCode": "America/Chicago", "utc": "-06:00"}, "title": "Lake Forest Park"},
      {"branch": [{"branchid": "QVR9NU4", "name": "Mercy St. Vincent", "simulators": ["Y15VW", "LOY4J", "NHMZU", "XQKV9", "JRQGT"]}], "date": 1649789996173, "facilityCode": "LGKXS", "facilityid": "aKbgjmITDjRuJFf4ZCjF", "simulators": [{"make": "Gaumard", "model": "", "name": "Pedi HAL", "serial": "", "simulatorid": "Y15VW"}, {"make": "Gaumard", "model": "", "name": "NewBorn HAL", "serial": "", "simulatorid": "LOY4J"}, {"make": "Gaumard", "model": "", "name": "Premie HAL", "serial": "", "simulatorid": "NHMZU"}, {"make": "Gaumard", "model": "", "name": "Noelle", "serial": "", "simulatorid": "XQKV9"}, {"make": "CAE", "model": "", "name": "METIman", "serial": "", "simulatorid": "JRQGT"}], "title": "Mercy St. Vincent"},
      {"branch": [{"branchid": "1eM5T", "name": "Messiah", "simulators": ["SJ6S3DB", "TMRQR68", "2VNEFNY", "M5VHUCJ", "UVX0AFX", "QEF5MVI", "TNS54P1", "VBDPN9Y"]}], "date": 1632451346468, "facilityCode": "T3O2T", "facilityid": "HjQioCbT6OtoO2iMM7Xk", "simulators": [{"make": "CAE", "model": "Apollo", "name": "Apollo", "serial": "", "simulatorid": "SJ6S3DB"}, {"make": "CAE", "model": "Athena", "name": "Athena", "serial": "", "simulatorid": "TMRQR68"}, {"make": "CAE", "model": "METIman", "name": "METIman", "serial": "", "simulatorid": "2VNEFNY"}, {"make": "CAE", "model": "Lucina", "name": "Lucina", "serial": "", "simulatorid": "M5VHUCJ"}, {"make": "CAE", "model": "PediaSIM", "name": "PediaSIM", "serial": "", "simulatorid": "UVX0AFX"}, {"make": "CAE", "model": "BabySIM", "name": "BabySIM", "serial": "", "simulatorid": "QEF5MVI"}, {"make": "Gaumard", "model": "Super Tory", "name": "Super Tory", "serial": "", "simulatorid": "TNS54P1"}, {"make": "Gaumard", "model": "Advanced Pediatric HAL", "name": "Advanced Pediatric HAL", "serial": "", "simulatorid": "VBDPN9Y"}], "title": "Messiah"},
      {"branch": [{"branchid": "1eM5T", "name": "Michener", "simulators": ["EG1O9C6", "ILGT1PK"]}], "date": 1632446918858, "facilityCode": "90PE6", "facilityid": "ISFt2AKdpMaUtY2GSvso", "simulators": [{"make": "Laerdal", "model": "SimMan Classic", "name": "SimMan Classic", "serial": "", "simulatorid": "EG1O9C6"}, {"make": "Laerdal", "model": "SimBaby", "name": "SimBaby", "serial": "", "simulatorid": "ILGT1PK"}], "title": "Michener"},
      {"branch": [{"branchid": "1eM5T", "name": "MNU", "simulators": ["9AL6S", "T5GJD", "E5VU1", "9E81Z", "G8DP0", "LTR7F"]}], "date": 1632452713564, "facilityCode": "DJYDQ", "facilityid": "6nWrNcg4neCFtB2CQYO2", "simulators": [{"make": "Gaumard", "model": "S3101", "name": "HAL", "serial": "", "simulatorid": "9AL6S"}, {"make": "Gaumard", "model": "S575.100", "name": "Noelle", "serial": "", "simulatorid": "T5GJD"}, {"make": "Laerdal", "model": "", "name": "VitalSim", "serial": "", "simulatorid": "E5VU1"}, {"make": "Laerdal", "model": "", "name": "Nursing Anne Simulator - Tech Support", "serial": "", "simulatorid": "9E81Z"}, {"make": "Laerdal", "model": "", "name": "SimMan Essential -Tech Support", "serial": "", "simulatorid": "G8DP0"}, {"make": "Laerdal", "model": "", "name": "SimNewB - Tech Support", "serial": "", "simulatorid": "LTR7F"}], "title": "MidAmerica Nazarene University"},
      {"branch": [{"branchid": "1eM5T", "name": "MultiCare", "simulators": ["VQJL7YR", "392ZA82", "Z4BAWT8", "4L8D1HM", "SXI3B6T", "37EM1QV", "XF771J5"]}], "date": 1632447876490, "facilityCode": "JHPM2", "facilityid": "EmfSanDnGqKbb4w6p0Ej", "simulators": [{"make": "Laerdal", "model": "SimMan 3G", "name": "SimMan 3G", "serial": "", "simulatorid": "VQJL7YR"}, {"make": "Laerdal", "model": "SimMan Classic", "name": "SimMan Classic", "serial": "", "simulatorid": "392ZA82"}, {"make": "Gaumard", "model": "Noelle", "name": "Noelle", "serial": "", "simulatorid": "Z4BAWT8"}, {"make": "Gaumard", "model": "Pediatric Hal 5 Y/O", "name": "Pediatric Hal 5 Y/O", "serial": "", "simulatorid": "4L8D1HM"}, {"make": "Gaumard", "model": "Pediatric Hal 1 Y/O", "name": "Pediatric Hal 1 Y/O", "serial": "", "simulatorid": "SXI3B6T"}, {"make": "Gaumard", "model": "Newborn HAL", "name": "Newborn HAL", "serial": "", "simulatorid": "37EM1QV"}, {"make": "Laerdal", "model": "SimBaby Classic", "name": "SimBaby Classic", "serial": "", "simulatorid": "XF771J5"}], "title": "MultiCare"},
      {"branch": [{"branchid": "B2K90U5", "name": "NVRH", "simulators": ["BY4IN", "IMDZY", "ZMCY6", "C7HVF"]}], "date": 1649458609035, "facilityCode": "R06JC", "facilityid": "WADriBMOXq5GewMtBx6S", "simulators": [{"make": "CAE", "model": "", "name": "Lucina", "serial": "", "simulatorid": "BY4IN"}, {"make": "CAE", "model": "", "name": "BabySIM", "serial": "", "simulatorid": "IMDZY"}, {"make": "Laerdal", "model": "", "name": "MegaCode Kelly", "serial": "", "simulatorid": "ZMCY6"}, {"make": "CAE", "model": "", "name": "MegaCode Kid", "serial": "", "simulatorid": "C7HVF"}], "title": "Northern Vermont Regional Hospital"},
      {"branch": [{"branchid": "1VeBT", "name": "Northwest University", "simulators": ["AS3DF1P", "976XKMN", "SCFHMM1", "XLVVCUJ", "3T1CDTO"]}], "date": 1632447459948, "facilityCode": "TGF4J", "facilityid": "35ykNMma2rLMlL9DMsc8", "simulators": [{"make": "Laerdal", "model": "SimMan 3G", "name": "SimMan 3G", "serial": "", "simulatorid": "AS3DF1P"}, {"make": "Laerdal", "model": "SimBaby", "name": "SimBaby", "serial": "", "simulatorid": "976XKMN"}, {"make": "Laerdal", "model": "SimJunior", "name": "SimJunior", "serial": "", "simulatorid": "SCFHMM1"}, {"make": "Laerdal", "model": "Nursing Anne Simulator", "name": "Nursing Anne Simulator", "serial": "", "simulatorid": "XLVVCUJ"}, {"make": "Gaumard", "model": "VitalSim", "name": "VitalSim", "serial": "", "simulatorid": "3T1CDTO"}], "timezone": {"label": "Pacific Standard Time (GMT-08:00)", "name": "(GMT-08:00) Pacific Time (US and Canada); Tijuana", "tzCode": "America/Tijuana", "utc": "-08:00"}, "title": "Northwest University"},
      {"branch": [{"branchid": "eRM5T", "name": "Parkland College", "simulators": ["5T8RJBP", "H5QU8OV", "993BZE7", "8W1EWC7", "G3INHJF", "F6HBX6P", "1PRU9U2", "67C3WHF", "X434W3G", "5MKSGO0"]}], "date": 1632449714652, "facilityCode": "V9A4C", "facilityid": "RtqgplyDozY0ZaJutLtb", "simulators": [{"make": "CAE", "model": "iStanl", "name": "iStanl", "serial": "", "simulatorid": "5T8RJBP"}, {"make": "CAE", "model": "METIman", "name": "METIman", "serial": "", "simulatorid": "H5QU8OV"}, {"make": "Gaumard", "model": "Noelle", "name": "Noelle", "serial": "", "simulatorid": "993BZE7"}, {"make": "Laerdal", "model": "Nursing Anne Simulator", "name": "Nursing Anne Simulator", "serial": "", "simulatorid": "8W1EWC7"}, {"make": "Laerdal", "model": "VitalSim", "name": "VitalSim", "serial": "", "simulatorid": "G3INHJF"}, {"make": "Laerdal", "model": "MegaCode Kelly", "name": "MegaCode Kelly", "serial": "", "simulatorid": "F6HBX6P"}, {"make": "Gaumard", "model": "HAL", "name": "HAL", "serial": "", "simulatorid": "1PRU9U2"}, {"make": "Simulaids", "model": "IV Training Arm", "name": "IV Training Arm", "serial": "", "simulatorid": "67C3WHF"}, {"make": "Abbot", "model": "Plum A+ IV Pump", "name": "Plum A+ IV Pump", "serial": "", "simulatorid": "X434W3G"}, {"make": "Simulaids", "model": "Geri Nursing Manikin", "name": "Geri Nursing Manikin", "serial": "", "simulatorid": "5MKSGO0"}], "timezone": {"label": "Mid-Atlantic Standard Time (GMT-02:00)", "name": "(GMT-02:00) Mid-Atlantic", "tzCode": "Atlantic/South_Georgia", "utc": "-02:00"}, "title": "Parkland College"},
      {"branch": [{"branchid": "1eM5T", "name": "Saint Louis University", "simulators": ["0B1NJV3", "NBD523V"]}], "date": 1632447965239, "facilityCode": "HPC2J", "facilityid": "HBdQ5lL3gwCrBUtQ188U", "simulators": [{"make": "Laerdal", "model": "SimMan 3G", "name": "SimMan 3G", "serial": "", "simulatorid": "0B1NJV3"}, {"make": "Laerdal", "model": "SimBaby", "name": "SimBaby", "serial": "", "simulatorid": "NBD523V"}], "title": "Saint Louis University"},
      {"branch": [{"branchid": "1eM5T", "name": "Sherbrooke", "simulators": ["BZDEBE0", "WP2TRQV", "V60JPHL", "86Q0725", "A1X6YDC", "SNFIPL5", "7RKVXQ4"]}], "date": 1632451429336, "facilityCode": "MTRXT", "facilityid": "vlbJHPqxz1OX9Z0nuQtR", "simulators": [{"make": "CAE", "model": "BabySIM", "name": "BabySIM", "serial": "", "simulatorid": "BZDEBE0"}, {"make": "CAE", "model": "PediaSIM ECS", "name": "PediaSIM ECS", "serial": "", "simulatorid": "WP2TRQV"}, {"make": "CAE", "model": "iStan", "name": "iStan", "serial": "", "simulatorid": "V60JPHL"}, {"make": "CAE", "model": "Lucina", "name": "Lucina", "serial": "", "simulatorid": "86Q0725"}, {"make": "CAE", "model": "METIman Prehospital", "name": "METIman Prehospital", "serial": "", "simulatorid": "A1X6YDC"}, {"make": "Laerdal", "model": "SimMan3G", "name": "SimMan3G", "serial": "", "simulatorid": "SNFIPL5"}, {"make": "CAE", "model": "LearningSpace", "name": "LearningSpace", "serial": "", "simulatorid": "7RKVXQ4"}], "title": "Sherbrooke"},
      {"branch": [{"branchid": "0AGBT", "name": "Kearney", "simulators": ["9PAGPA", "8DPTSS", "7LDSFK", "5DSGSB"]}, {"branchid": "1TGPA", "name": "Norfolk", "simulators": ["9PAGPA", "8DPTSS", "7LDSFK", "5DSGSB"]}, {"branchid": "2TPGA", "name": "Scottsbluff", "simulators": ["9PAGPA", "8DPTSS", "7LDSFK", "5DSGSB"]}, {"branchid": "3PDPT", "name": "UNMC-DGC", "simulators": ["9PAGPA", "8DPTSS", "7LDSFK", "5DSGSB"]}], "date": 1646014043453, "facilityCode": "5K6YX", "facilityid": "F0qwBLHboYJC5e1Wi2JW", "simulators": [{"make": "CAE", "model": "", "name": "Lucina", "serial": "MFS0314", "simulatorid": "9PAGPA"}, {"make": "CAE", "model": "", "name": "METIman", "serial": "MMP1364", "simulatorid": "8DPTSS"}, {"make": "Gaumard", "model": "S2225", "name": "Advanced Pedi HAL S2225 5 YO ", "serial": "X2002362M", "simulatorid": "7LDSFK"}, {"make": "Gaumard", "model": "S2210", "name": "Newborn Tory S2210", "serial": "B6006554M", "simulatorid": "5DSGSB"}], "title": "SIMNE"},
      {"branch": [{"branchid": "1VeBT", "name": "Southwest Tennessee", "simulators": ["WOS1I5M", "QCR04ZQ", "K47J3PS", "AYESCMO"]}], "date": 1632450901842, "facilityCode": "II5RE", "facilityid": "LMXzzbf0wUsubUnLxqWg", "simulators": [{"make": "Laerdal", "model": "SimMan 3G", "name": "SimMan 3G", "serial": "", "simulatorid": "WOS1I5M"}, {"make": "Laerdal", "model": "SimBaby", "name": "SimBaby", "serial": "", "simulatorid": "QCR04ZQ"}, {"make": "Laerdal", "model": "SimJunior", "name": "SimJunior", "serial": "", "simulatorid": "K47J3PS"}, {"make": "Laerdal", "model": "SimMom", "name": "SimMom", "serial": "", "simulatorid": "AYESCMO"}], "title": "Southwest Tennessee"},
      {"branch": [{"branchid": "399AU4G", "name": "St. Charles Community College", "simulators": ["NXLNM", "65INP", "YHELW", "6C12J", "YRMS6", "KFYAW", "H89X2", "DBEYB", "SAYJR", "15LOS", "EDTP1", "471FE", "YCT5F"]}], "date": 1649453073808, "facilityCode": "5F66E", "facilityid": "QE8LDLIWTl6rukfEIKMA", "simulators": [{"make": "CAE", "model": "", "name": "Apollo", "serial": "", "simulatorid": "NXLNM"}, {"make": "CAE", "model": "", "name": "METIman Nursing", "serial": "", "simulatorid": "65INP"}, {"make": "CAE", "model": "", "name": "PediaSIM", "serial": "", "simulatorid": "YHELW"}, {"make": "CAE", "model": "", "name": "BabySIM", "serial": "", "simulatorid": "6C12J"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "", "simulatorid": "YRMS6"}, {"make": "CAE", "model": "", "name": "Lucina", "serial": "", "simulatorid": "KFYAW"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "H89X2"}, {"make": "Gaumard", "model": "", "name": "Noelle", "serial": "", "simulatorid": "DBEYB"}, {"make": "Gaumard", "model": "", "name": "Newborn HAL", "serial": "", "simulatorid": "SAYJR"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "", "simulatorid": "15LOS"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "", "simulatorid": "EDTP1"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "", "simulatorid": "471FE"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "YCT5F"}], "title": "St. Charles Community College"},
      {"branch": [{"branchid": "1eM5T", "name": "Stratton VA", "simulators": ["GE3OG7R"]}], "date": 1632447997866, "facilityCode": "1F3BZ", "facilityid": "HiYiQxuvzZ6upm3okxlx", "simulators": [{"make": "Laerdal", "model": "SimMan 3G", "name": "SimMan 3G", "serial": "", "simulatorid": "GE3OG7R"}], "title": "Stratton VA"},
      {"branch": [{"branchid": "2XCND", "name": "UNMC-DGC", "simulators": ["8DBDFG", "3NGNCJ", "8BSDPQ", "0DQBCZ"]}], "date": 1646016279495, "facilityCode": "Y2AAV", "facilityid": "aKwAQ8L0OYX0GDI1OWMm", "simulators": [{"make": "CAE", "model": "", "name": "Ares", "serial": "", "simulatorid": "8DBDFG"}, {"make": "Gaumard", "model": "S2000", "name": "Susie S2000 (Dark)", "serial": "S1910564", "simulatorid": "3NGNCJ"}, {"make": "Gaumard", "model": "S2000", "name": "Victoria S2200", "serial": "V1805607", "simulatorid": "8BSDPQ"}, {"make": "Gaumard", "model": "S2000", "name": "Susie S2000 (Light)", "serial": "S1910563", "simulatorid": "0DQBCZ"}], "title": "TSQC"},
      {"branch": [{"branchid": "1eM5T", "name": "Capstone", "simulators": ["ENAEE", "GUW5S", "829F1", "DSRKQ", "65Z70", "Y5OQR", "KTDPI", "ZYVI6", "Q9RKC", "CX9TU", "9LPWP"]}], "date": 1632451492693, "facilityCode": "5T84P", "facilityid": "wdQiHCzeiHyyiwSUxUKp", "simulators": [{"make": "Laerdal", "model": "", "name": "SimMan 3G", "serial": "", "simulatorid": "S8JJX"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "ENAEE"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "GUW5S"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "829F1"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "DSRKQ"}, {"make": "CAE", "model": "", "name": "PediaSim", "serial": "", "simulatorid": "65Z70"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "", "simulatorid": "Y5OQR"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "", "simulatorid": "KTDPI"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "ZYVI6"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "Q9RKC"}, {"make": "CAE", "model": "", "name": "Lucina", "serial": "", "simulatorid": "CX9TU"}, {"make": "", "model": "S575.100", "name": "Learning Space", "serial": "", "simulatorid": "9LPWP"}], "title": "U of AL Capstone"},
      {"branch": [{"branchid": "1eM5T", "name": "University of Calgary", "simulators": ["DH3AX5N", "WA81RMX", "0ERMYYN", "UQLL2YX", "ZUUWPS0", "UWZK873", "01RZFFE", "TSCOCTC", "1B0CJUN", "PC5X03E", "CI1HOPB", "0M9VIJN", "FHXYIK5", "V46G1GI", "S09WTYJ", "1GK24ME"]}], "date": 1632446796916, "facilityCode": "CVGBJ", "facilityid": "qUYIGAh3ihbg9Ce2Yb9F", "sharedEmails": ["pford@echosimulation.com", "jeff.dawes@ucalgary.ca"], "simulators": [{"make": "Laerdal", "model": "SimMan 3G", "name": "SimMan 3G", "serial": "", "simulatorid": "DH3AX5N"}, {"make": "Laerdal", "model": "SimNewB", "name": "SimNewB", "serial": "", "simulatorid": "WA81RMX"}, {"make": "Laerdal", "model": "VitalSim", "name": "VitalSim", "serial": "", "simulatorid": "0ERMYYN"}, {"make": "Laerdal", "model": "Nursing Kid", "name": "Nursing Kid", "serial": "", "simulatorid": "UQLL2YX"}, {"make": "Laerdal", "model": "Resusci Anne QCPR", "name": "Resusci Anne QCPR", "serial": "", "simulatorid": "ZUUWPS0"}, {"make": "Laerdal", "model": "Resusci Baby", "name": "Resusci Baby", "serial": "", "simulatorid": "UWZK873"}, {"make": "CAE", "model": "Juno", "name": "Juno", "serial": "", "simulatorid": "01RZFFE"}, {"make": "CAE", "model": "Lucina", "name": "Lucina", "serial": "", "simulatorid": "TSCOCTC"}, {"make": "Gaumard", "model": "Pediatric Hal 5 Y/O", "name": "Pediatric Hal 5 Y/O", "serial": "", "simulatorid": "1B0CJUN"}, {"make": "Gaumard", "model": "Pediatric Hal 1 Y/O", "name": "Pediatric Hal 1 Y/O", "serial": "", "simulatorid": "PC5X03E"}, {"make": "Lifecast", "model": "Adult Male", "name": "Adult Male", "serial": "", "simulatorid": "CI1HOPB"}, {"make": "Lifecast", "model": "Adult Female", "name": "Adult Female", "serial": "", "simulatorid": "0M9VIJN"}, {"make": "Lifecast", "model": "Child Female", "name": "Child Female", "serial": "", "simulatorid": "FHXYIK5"}, {"make": "Lifecast", "model": "Toddler Male", "name": "Toddler Male", "serial": "", "simulatorid": "V46G1GI"}, {"make": "Lifecast", "model": "Baby Male", "name": "Baby Male", "serial": "", "simulatorid": "S09WTYJ"}, {"make": "Admin", "model": "SimMan3G - Fred", "name": "SimMan3G - Fred", "serial": "", "simulatorid": "1GK24ME"}], "timezone": {"label": "Central America Standard Time (GMT-06:00)", "name": "(GMT-06:00) Central America", "tzCode": "America/Costa_Rica", "utc": "-06:00"}, "title": "University of Calgary"},
      {"branch": [{"branchid": "FSUEEJW", "name": "University of Mobile", "simulators": ["D9HZT", "ZIOVO", "IEB9P", "KGP4B", "QXFP7", "KCN3B", "DNR2G"]}], "date": 1649453010184, "facilityCode": "V96AN", "facilityid": "YAovmEzvpNY0jMKvkGL9", "simulators": [{"make": "CAE", "model": "", "name": "Apollo", "serial": "APP046", "simulatorid": "D9HZT"}, {"make": "CAE", "model": "", "name": "PediaSim", "serial": "PECS882", "simulatorid": "ZIOVO"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "ISTAN1277", "simulatorid": "IEB9P"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "ISTAN1372", "simulatorid": "KGP4B"}, {"make": "CAE", "model": "", "name": "Lucina", "serial": "MFS2197", "simulatorid": "QXFP7"}, {"make": "CAE", "model": "", "name": "Lucina", "serial": "MFS0388", "simulatorid": "KCN3B"}, {"make": "CAE", "model": "", "name": "Athena", "serial": "ATH2036", "simulatorid": "5O8DK"}, {"make": "CAE", "model": "", "name": "Athena", "serial": "ATH2036", "simulatorid": "DNR2G"}], "title": "University of Mobile"},
      {"branch": [{"branchid": "2SWTUWX", "name": "University of North Georgia", "simulators": ["B2OZB", "3VLAO", "NU0H8", "HBWMT", "H2HIB", "Z6XEO"]}], "date": 1649881202046, "facilityCode": "LO1UZ", "facilityid": "lYMx7oYG85NHdBPb1JL3", "simulators": [{"make": "CAE", "model": "", "name": "iStan", "serial": "", "simulatorid": "B2OZB"}, {"make": "CAE", "model": "", "name": "Apollo", "serial": "", "simulatorid": "3VLAO"}, {"make": "Gaumard", "model": "", "name": "Tory", "serial": "", "simulatorid": "NU0H8"}, {"make": "Gaumard", "model": "", "name": "Victoria", "serial": "", "simulatorid": "HBWMT"}, {"make": "Gaumard", "model": "", "name": "HAL", "serial": "", "simulatorid": "H2HIB"}, {"make": "Gaumard", "model": "", "name": "Pediatric Hal 5 Y/O", "serial": "", "simulatorid": "Z6XEO"}], "title": "University of North Georgia"},
      {"branch": [{"branchid": "1eM5T", "name": "University of Toledo", "simulators": ["0YRBZHP", "BIDLSJX", "B7PFOC5"]}], "date": 1632448266234, "facilityCode": "QNSKH", "facilityid": "7BRHVeA2e444CUXS6nMG", "simulators": [{"make": "Gaumard", "model": "Pediatric Hal 5 Y/O", "name": "Pediatric Hal 5 Y/O", "serial": "", "simulatorid": "0YRBZHP"}, {"make": "Gaumard", "model": "Newborn HAL", "name": "Newborn HAL", "serial": "", "simulatorid": "BIDLSJX"}, {"make": "Laerdal", "model": "SimBaby Classic", "name": "SimBaby Classic", "serial": "", "simulatorid": "B7PFOC5"}], "title": "University of Toledo"},
      {"branch": [{"branchid": "1eM5T", "name": "Pheonix", "simulators": ["XV37Q12", "WWINEZN", "KRQZM32", "XWW5TAX", "EJF86KH", "CLWYK7A", "9DLRSFP", "SPQBQF0", "3S7DK6H", "W53FH5V"]}], "date": 1632453136917, "facilityCode": "7O1A1", "facilityid": "xfR1e2n2zx2Oe8kxMKIG", "simulators": [{"make": "Laerdal", "model": "SimMan 3G 212-00050", "name": "SimMan 3G 212-00050", "serial": "", "simulatorid": "XV37Q12"}, {"make": "Laerdal", "model": "SimBaby Classic 245-05050", "name": "SimBaby Classic 245-05050", "serial": "", "simulatorid": "WWINEZN"}, {"make": "Laerdal", "model": "SimMan Essential 213-00050", "name": "SimMan Essential 213-00050", "serial": "", "simulatorid": "KRQZM32"}, {"make": "Laerdal", "model": "Sim Junior 232-05050", "name": "Sim Junior 232-05050", "serial": "", "simulatorid": "XWW5TAX"}, {"make": "Laerdal", "model": "Premature Anne 295-00050", "name": "Premature Anne 295-00050", "serial": "", "simulatorid": "EJF86KH"}, {"make": "Laerdal", "model": "SimNewB Classic 220-01001", "name": "SimNewB Classic 220-01001", "serial": "", "simulatorid": "CLWYK7A"}, {"make": "Gaumard", "model": "Victoria", "name": "Victoria", "serial": "", "simulatorid": "9DLRSFP"}, {"make": "Gaumard", "model": "Super Tory", "name": "Super Tory", "serial": "", "simulatorid": "SPQBQF0"}, {"make": "Gaumard", "model": "Pedi Hal ADV 5 yr old", "name": "Pedi Hal ADV 5 yr old", "serial": "", "simulatorid": "3S7DK6H"}, {"make": "Gaumard", "model": "Premi Hal", "name": "Premi Hal", "serial": "", "simulatorid": "W53FH5V"}], "title": "Valleywise Health"},
      {"branch": [{"branchid": "PDD13DG", "name": "Bennington", "simulators": ["8WHN7", "0JO28", "PE58U"]}, {"branchid": "eRM5T", "name": "Brattleboro", "simulators": ["RGEUWBO", "0VCALA2", "FKOHNBF"]}, {"branchid": "1eM5T", "name": "Randolph", "simulators": ["3Y6QM"]}, {"branchid": "BSFVOT3", "name": "St. Johnsbury", "simulators": ["0VCALA2"]}, {"branchid": "1VeBT", "name": "Wilder", "simulators": ["8WHN7", "B0O9U"]}, {"branchid": "VR4EO58", "name": "Williston", "simulators": ["SILB6", "3Y6QM", "IZM10"]}], "date": 1632449241528, "facilityCode": "6HLHU", "facilityid": "ZaDTx09FFninZPWU6wg5", "simulators": [{"make": "CAE", "model": "METIman", "name": "METIman", "serial": "MMN197", "simulatorid": "RGEUWBO"}, {"make": "CAE", "model": "PediaSIM", "name": "PediaSIM", "serial": "PECS461", "simulatorid": "0VCALA2"}, {"make": "CAE", "model": "Ares", "name": "Ares", "serial": "", "simulatorid": "5NJ8X8A"}, {"make": "CAE", "model": "Juno", "name": "Juno", "serial": "Juno495", "simulatorid": "FKOHNBF"}, {"make": "CAE", "model": "", "name": "pediaSIM", "serial": "PECS462", "simulatorid": "0JO28"}, {"make": "CAE", "model": "", "name": "pediaSIM", "serial": "PECS464", "simulatorid": "SILB6"}, {"make": "CAE", "model": "", "name": "pediaSIM", "serial": "PECS461", "simulatorid": "SP5NC"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "Juno495", "simulatorid": "PE58U"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "Juno494", "simulatorid": "B0O9U"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "Juno295", "simulatorid": "IZM10"}, {"make": "CAE", "model": "", "name": "Ares", "serial": "Ares053", "simulatorid": "3Y6QM"}, {"make": "CAE", "model": "", "name": "METIman", "serial": "MMN198", "simulatorid": "8WHN7"}, {"make": "CAE", "model": "", "name": "METIman", "serial": "MMN196", "simulatorid": "66VX7"}, {"make": "CAE", "model": "", "name": "Juno", "serial": "Juno295", "simulatorid": "L5QJH"}], "title": "Vermont Technical College"},
      {"branch": [{"branchid": "FCVBJQX", "name": "Victor Valley", "simulators": ["EWYUM", "B20PT", "A1CSA", "7U21G", "G0LY7", "HBI61", "GWTDR", "RUQFW", "TJ0J1", "UHM3R", "S5XGV", "63FO4", "TJYYC"]}], "date": 1649451359312, "facilityCode": "U4V0F", "facilityid": "cBSZ3DbZxRwgAu1NS0NH", "simulators": [{"make": "Gaumard", "model": "", "name": "Pediatric Hal 5 Y/O", "serial": "", "simulatorid": "JPLFB"}, {"make": "Gaumard", "model": "", "name": "Newborn HAL", "serial": "", "simulatorid": "T9ZXS"}, {"make": "CAE", "model": "", "name": "METIman", "serial": "MMP639", "simulatorid": "EWYUM"}, {"make": "Laerdal", "model": "", "name": "Nursing Anne", "serial": "", "simulatorid": "B20PT"}, {"make": "Laerdal", "model": "", "name": "Nursing Kelly", "serial": "", "simulatorid": "A1CSA"}, {"make": "CAE", "model": "", "name": "MetiMan", "serial": "MMP640", "simulatorid": "7U21G"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "ISTAN259", "simulatorid": "G0LY7"}, {"make": "CAE", "model": "", "name": "Lucina", "serial": "MFS0185", "simulatorid": "HBI61"}, {"make": "Laerdal", "model": "", "name": "Nursing Anne", "serial": "", "simulatorid": "GWTDR"}, {"make": "Laerdal", "model": "", "name": "Nursing Anne", "serial": "", "simulatorid": "RUQFW"}, {"make": "Laerdal", "model": "", "name": "Nursing Anne", "serial": "", "simulatorid": "TJ0J1"}, {"make": "Laerdal", "model": "", "name": "Nursing Kelly", "serial": "", "simulatorid": "UHM3R"}, {"make": "Laerdal", "model": "", "name": "Nursing Kelly", "serial": "", "simulatorid": "S5XGV"}, {"make": "Laerdal", "model": "", "name": "Nursing Kelly", "serial": "", "simulatorid": "63FO4"}, {"make": "CAE", "model": "", "name": "MetiMan", "serial": "MMN344", "simulatorid": "TJYYC"}], "title": "Victor Valley College"},
      {"branch": [{"branchid": "1eM5T", "name": "WSCC", "simulators": ["XZ8DW", "3PYD3", "KU4KA", "83BWH", "C0698", "880ML"]}], "date": 1632452721754, "facilityCode": "G2ODF", "facilityid": "arM2sCdgMD1H7ppXBYbY", "simulators": [{"make": "Laerdal", "model": "", "name": "SimMan 3G", "serial": "21226154613", "simulatorid": "XZ8DW"}, {"make": "Laerdal", "model": "", "name": "SimMan 3G", "serial": "21226154619", "simulatorid": "3PYD3"}, {"make": "Laerdal", "model": "", "name": "SimMom", "serial": "UMS2815001", "simulatorid": "KU4KA"}, {"make": "Laerdal", "model": "", "name": "SimBaby Classic", "serial": "245261503114", "simulatorid": "83BWH"}, {"make": "Laerdal", "model": "", "name": "SimBaby", "serial": "365M12110004", "simulatorid": "C0698"}, {"make": "Laerdal", "model": "", "name": "MegaCode Kelly ADV", "serial": "", "simulatorid": "880ML"}], "title": "West Shore Community College"},
      {"branch": [{"branchid": "1eM5T", "name": "Western Dakota", "simulators": ["G5QL0", "BIVUJ", "Y3WAP", "H9MP0", "SFG6W", "PGZOE", "RP5A1", "GJB3U", "QHSHK", "HRR9M"]}], "date": 1632452740313, "facilityCode": "9XNZM", "facilityid": "JS1nHrD0nAehNNng94fY", "simulators": [{"make": "Laerdal", "model": "", "name": "SimMan 3G", "serial": "21237112248", "simulatorid": "G5QL0"}, {"make": "CAE", "model": "", "name": "Apollo", "serial": "APP0711", "simulatorid": "BIVUJ"}, {"make": "CAE", "model": "", "name": "Caesar", "serial": "CAESAR0180", "simulatorid": "Y3WAP"}, {"make": "CAE", "model": "", "name": "iStan", "serial": "1101", "simulatorid": "H9MP0"}, {"make": "CAE", "model": "", "name": "Lucina", "serial": "MFS084", "simulatorid": "SFG6W"}, {"make": "CAE", "model": "", "name": "MetiMan", "serial": "MMP724", "simulatorid": "PGZOE"}, {"make": "CAE", "model": "", "name": "MetiMan", "serial": "MMN511", "simulatorid": "RP5A1"}, {"make": "Gaumard", "model": "", "name": "Noelle", "serial": "N1105900", "simulatorid": "GJB3U"}, {"make": "Laerdal", "model": "", "name": "SimMan 3G", "serial": "21231090332", "simulatorid": "QHSHK"}, {"make": "Laerdal", "model": "", "name": "SimMan 3G", "serial": "212430090609", "simulatorid": "HRR9M"}], "title": "Western Dakota Tech"}
    ];

    const batch = firestore().batch();

    facilites.forEach(facility => {    
      console.log("FAC is ==>", facility);

      const docid = facility.facilityid;
      const facRef = firestore().collection('facility').doc(docid);
      batch.set(facRef, facility);
    });
  
    return batch.commit();    
  }

  getSupports = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getCompanySupports', {
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
        return;
      }

      this.setState({
        isLoading: false,
        supports: responseJson.request,
        activeSupports: responseJson.active,
        scheduledSupports: responseJson.scheduled,        
        closedSupports: responseJson.closed, 
      });     
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });

      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  goSearch = () => {
    this.props.navigation.navigate('SupportSearch', {
      supports: this.state.supports
    });
  }

  selectRow = item => {
    if (item.status === 'accepted' || item.status === 'addedColleague'){
      if (item.type == 'Chat') {
        this.joinHandler(item) 
      } else {
        this.sendReconnectNotification(item)  

        setTimeout(() => {
          this.joinCallHandler(item) 
        }, 200)
      }
    } else if (item.status === 'completed'){
      this.props.navigation.push('SupportDetail', {
        request: item,
        isFromScheduleSupport: false,        
      }) 
    } else {
      if ( (item.isSchedule == true) && (item.status == 'pending' || item.status == 'scheduled') ) {
        this.props.navigation.navigate('ScheduleSupport', {
          request: item
        })
      }
    } 
  }

  joinHandler = (item) => {   
    const { joingDialog,  navigation, selected } = this.props

    global.curUser = item.receiver
    global.selectedRequest = item
    
    const dialog = item.dialog
    navigation.navigate('Messages', {dialog})
  }

  sendReconnectNotification = (request) => {
    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/sendReconnectNotification', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request: request,
        issender: false
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
        });
        return;
      } 
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
    });
  }

  joinCallHandler = (request) => {   
    this.setState({
      isLoading: false,
    });
    
    const { selectUser, selected = [] } = this.props

    const user = request.sender
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

    setTimeout(() => {
      this.initCall(request) 
    }, 200); 
  }

  initCall = (request) => {
    const { call, selected } = this.props
    const opponentsIds = selected.map(user => user.id)
    global.selectedRequest = request

    try {
      if (request.type === 'Call') {
        call({ opponentsIds, type: QB.webrtc.RTC_SESSION_TYPE.AUDIO })
      } else {
        call({ opponentsIds, type: QB.webrtc.RTC_SESSION_TYPE.VIDEO })
      }
    } catch (e) {
      showError('Audo Error', e.message)
    }
  }

  renderSupportItem = ({item}) => (
    <SupportItem
      support={item}
      status={this.state.segementIndex}
      onSelectRow={this.selectRow}
    />
  )
  
  render() {
    var supportData = [];
    if (this.state.scheduledSupports.length > 0 ) {
      supportData.push({
        title: "Scheduled",
        data: this.state.scheduledSupports,
      })
    }

    if (this.state.activeSupports.length > 0 ) {
      supportData.push({
        title: "Active",
        data: this.state.activeSupports,
      })
    }

    if (this.state.closedSupports.length > 0 ) {
      supportData.push({
        title: "Earlier",
        data: this.state.closedSupports,
      })
    } 

    return (
      <Background>

        <View style = {styles.navigationView}>
          <Text style={styles.pageTitle}>Support History</Text>
          <View style={{flex: 1}} />
          <TouchableOpacity style={styles.rightButton} onPress={() => this.goSearch()}>
            <Image
              style={styles.searchImage}
              source={require('../assets/images/support/search_blue.png')}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.listView}>
          <SegmentedControl
            style={styles.segementContainer}
            values={[
              'Active',
              'Scheduled',
              'Closed',
            ]}
            selectedIndex={this.state.segementIndex}
            onChange={(event) => {
              this.setState({segementIndex: event.nativeEvent.selectedSegmentIndex});
            }}
            fontStyle={{fontSize: 14, fontFamily: 'Poppins-SemiBold'}}
          />

            <FlatList
              data={this.state.segementIndex == 0 
                ? this.state.activeSupports
                : this.state.segementIndex == 1
                ? this.state.scheduledSupports
                : this.state.closedSupports
              }
              style={{marginTop: 0, flex: 1}}
              keyExtractor={(item, index) => item + index}
              renderItem={this.renderSupportItem}          
            />

          {/* {this.state.segementIndex == 0 ? 
            <FlatList
              data={this.state.activeSupports}
              style={{marginTop: 0, flex: 1}}
              keyExtractor={(item, index) => item + index}
              renderItem={({item, index }) => (
                <TouchableOpacity style={styles.cellView} onPress={() => this.selectRow(item)}>

                  <View style={styles.cellContentView}>     
                    <View style = {styles.imageView}>
                      { (item.sender.image == null) ? 
                        <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />
                        :<Image source={{uri : item.sender.image}} style={styles.profileImage}/> 
                      } 
                    </View>

                    <View style={styles.contentView}>
                      <View style={styles.nameView}>
                        <Text style={styles.nameText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                        <View  style={{flex: 1}}/>                      
                        <Text style={styles.timeText}>{item.isSchedule === true ? "" : item.status == "completed" ?  moment(item.time).format('MM/DD/YYYY') : moment(item.time).format('h:mm A')}</Text>
                      </View>    

                      <View style={styles.sessionView}>
                        <Image style={styles.callImage} source={ item.type == 'Call' ? require('../assets/images/home/iconVoice.png') :item.type == 'Video' ? require('../assets/images/home/iconVideo.png') : require('../assets/images/home/iconChat.png')}  />
                        <Text style={styles.contentText}>{item.isSchedule === true ? "At " + moment(item.scheduleTime).format('h A on MMMM D, YYYY.') : item.status == "completed" ? 'Session closed' : 'Active'}</Text>
                      </View>
                      
                      <View style={{flex:1}} />

                    </View>
                  </View>
                </TouchableOpacity>
              )}            
            /> 
            : this.state.segementIndex == 1 ? 
              <FlatList
                data={this.state.scheduledSupports}
                keyExtractor={(item, index) => item + index}
                renderItem={({item, index }) => (
                  <TouchableOpacity style={styles.cellView} onPress={() => this.selectRow(item)}>
                    <View style={styles.cellContentView}>   
                      <View style = {styles.imageView}>
                        { (item.sender.image == null) ? 
                          <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />
                          :<Image source={{uri : item.sender.image}} style={styles.profileImage}/> 
                        } 
                      </View>

                      <View style={styles.contentView}>
                        <View style={styles.nameView}>
                          <Text style={styles.nameText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                          <View  style={{flex: 1}}/>                      
                          <Text style={styles.timeText}>{item.isSchedule === true ? "" : item.status == "completed" ?  moment(item.time).format('MM/DD/YYYY') : moment(item.time).format('h:mm A')}</Text>
                        </View>    

                        <View style={styles.sessionView}>
                          <Image style={styles.callImage} source={ item.type == 'Call' ? require('../assets/images/home/iconVoice.png') :item.type == 'Video' ? require('../assets/images/home/iconVideo.png') : require('../assets/images/home/iconChat.png')}  />
                          <Text style={styles.contentText}>{item.isSchedule === true ? "At " + moment(item.scheduleTime).format('h:mm A on MMMM D, YYYY.') : item.status == "completed" ? 'Session closed' : ''}</Text>
                        </View>
                        
                        <View style={{flex:1}} />

                      </View>
                    </View>
                  </TouchableOpacity>
                )}            
              /> 
            : <FlatList
              data={this.state.closedSupports}
              keyExtractor={(item, index) => item + index}
              renderItem={({item, index }) => (
                <TouchableOpacity style={styles.cellView} onPress={() => this.selectRow(item)}>
                  <View style={styles.cellContentView}>   

                    <View style = {styles.imageView}>
                      { item.sender.image 
                        ?<Image source={{uri : item.sender.image}} style={styles.profileImage}/> 
                        :<Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage}/>                        
                      } 
                    </View>   

                    <View style={styles.contentView}>
                      <View style={styles.nameView}>
                        <Text style={styles.nameText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                        <View  style={{flex: 1}}/>                      
                        <Text style={styles.timeText}>{item.isSchedule === true ? "" : item.status == "completed" ?  moment(item.time).format('MM/DD/YYYY') : moment(item.time).format('h:mm A')}</Text>
                      </View>    

                      <View style={styles.sessionView}>
                        <Image style={styles.callImage} source={ item.type == 'Call' ? require('../assets/images/home/iconVoice.png') :item.type == 'Video' ? require('../assets/images/home/iconVideo.png') : require('../assets/images/home/iconChat.png')}  />
                        <Text style={styles.contentText}>{item.isSchedule === true ? "At " + moment(item.scheduleTime).format('h A on MMMM D, YYYY.') : item.status == "completed" ? 'Session closed' : ''}</Text>
                      </View>
                      
                      <View style={{flex:1}} />

                    </View>
                  </View>
                </TouchableOpacity>
              )}            
            />
          } */}

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
    width: 50,
    height: 50,
    paddingLeft: 14,
    paddingTop: 17,
  },

  searchImage: {
    width: 16,
    height: 16,
  },

  listView: {
    flex: 1,
    width: DEVICE_WIDTH,
    marginTop: 9,  
  },

  sectionView: {
    width: DEVICE_WIDTH,
    height: 42,
    backgroundColor: 'white',
  },

  sectionText: {
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 16,
    paddingTop: 6,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader
  },

  cellView: {
    width: DEVICE_WIDTH,
    height: 76,
  },

  cellContentView: {    
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 14,
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar,
  },

  contentView: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    marginTop: 12,
    justifyContent: 'flex-start',
  },

  nameView: {
    marginLeft: 1,
    flexDirection: 'row',
  },

  imageView: {
    width: 52,
    height: 52,
    marginLeft: 12,
    marginTop:7,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderColor: '#fff',
    borderWidth: 2,
  },

  iconImage: {
    width: 20,
    height: 20,
    position: 'absolute',
    right: 0,
    bottom: -2,
  },

  nameText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',     
  },

  timeText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.sectionHeader,    
  },

  sessionView: {
    flexDirection: 'row'
  },

  callImage: {
    width: 26,
    height: 26,        
    
    marginRight: 8,
  },

  contentText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    textAlign: 'left',
    color: theme.colors.sectionHeader,    
  },

  segementContainer: {
    height: 32,
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
}) 


const mapStateToProps = ({ auth, users, chat }, { exclude = [] }) => ({
  data: users
    .users
    .filter(user => auth.user ? user.id !== auth.user.id : true)
    .filter(user => exclude.indexOf(user.id) === -1),
  currentUser: auth.user,
  selected: users.selected,
  connected: chat.connected,  
  loading: chat.loading,
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
  joingDialog: dialogJoin,
}

export default connect(mapStateToProps, mapDispatchToProps)(SupportScreen)
