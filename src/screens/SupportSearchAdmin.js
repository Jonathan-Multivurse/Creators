import React, { Component } from 'react'
import { View, Platform, StyleSheet, Image, Dimensions, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'
import moment from 'moment'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class SupportSearchAdmin extends Component {
  constructor(props) {
      super(props)

      this.state = { 
        isLoading: false,    
        originalData: this.props.route.params.users,
        filteredData: this.props.route.params.users,
      }
  }

  searchFilter = (text) => {
    if (text) {
      const newData = this.state.originalData.filter(
        function(item){
          const itemData = (item.receiver.firstname + " " + item.receiver.lastname).toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
        }
      )
      this.setState({
        filteredData: newData,
      })
    } else {
      this.setState({
        filteredData: this.state.originalData,
      })
    }
  }

  render() {
    return (
      <Background>    
          <View style = {styles.navigationView}>      
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
            <TouchableOpacity onPress={() => this.props.navigation.goBack()} >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.listView}>
          <FlatList
            data={this.state.filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <View style={styles.cellView1}>
                <View style={styles.cellContentView1}>

                  <View style={styles.profileImageView1}>
                      <Image source={{uri : item.receiver.image}} style={styles.profileImage} />
                  </View>

                  <View style={styles.contentView}>
                    <Text style={styles.nameText}>{item.receiver.firstname + " " + item.receiver.lastname}</Text>

                    { (item.request == null) ?
                      <View style={{flexDirection: 'row', marginTop: 2}}>                        
                        <Image source={require('../assets/images/home/icon_offline.png')} style={styles.iconImage} />
                        <Text style={styles.timeText1}>Ideal</Text>
                      </View>                      
                    : <View style={{flexDirection: 'row', marginTop: 2}}>                        
                        <Image source={ (item.request.isSchedule) ? require('../assets/images/home/iconSchedule.png') : (item.request.type === 'Video') ? require('../assets/images/home/iconVideo.png') : (item.request.type === 'Call') ? require('../assets/images/home/iconVoice.png') : require('../assets/images/home/iconChat.png')} style={styles.iconImage} />
                        <Text style={styles.timeText}> {"with " + item.sender.firstname + " " + item.sender.lastname}</Text>
                      </View>}
                  </View>
                </View>
              </View>
          )}
          /> 
        </View>                         
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
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff'
    },
  
    navigationView: {
      width: '100%',
      height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
      alignSelf: 'center',
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      flexDirection: 'row',
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
  
    listView: {
      width: DEVICE_WIDTH,
      flex: 1,
      marginTop: 19,  
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
      },
    
      nameText: {
        fontSize: 16,    
        lineHeight: 22,
        fontFamily: 'Poppins-Medium',
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
        width: 20,
        height: 20,
        alignSelf: 'center'
      },  
    
  }) 