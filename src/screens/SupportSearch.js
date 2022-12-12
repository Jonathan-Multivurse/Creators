import React, { Component } from 'react'
import { View, Platform, StyleSheet, Image, Dimensions, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'
import moment from 'moment'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class SupportSearch extends Component {
  constructor(props) {
      super(props)

      this.state = { 
        isLoading: false,    
        originalData: this.props.route.params.supports,
        filteredData: this.props.route.params.supports,
      }
  }

  searchFilter = (text) => {
      if (text) {
        const newData = this.state.originalData.filter(
          function(item){
            const itemData = (item.sender.firstname + " " + item.sender.lastname).toUpperCase()
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
            <View style={styles.cellView}>
              <View style={styles.cellContentView}>                  
                <View style={styles.contentView}>
                  <View style={styles.nameView}>
                    <Text style={styles.nameText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                    <View  style={{flex: 1}}/>                                    
                    <Text style={styles.timeText}>{item.isSchedule === true ? "" : item.status == "completed" ?  moment(item.time).format('DD/MM/YYYY') : moment(item.time).format('h:mm A')}</Text>
                  </View> 

                  <View style={styles.sessionView}>
                    <Image style={styles.callImage} source={ item.type == 'Call' ? require('../assets/images/home/iconVoice.png') :item.type == 'Video' ? require('../assets/images/home/iconVideo.png') : require('../assets/images/home/iconChat.png')}  />
                    <Text style={styles.contentText}>{item.isSchedule === true ? "Meeting at " + moment(item.scheduleTime).format('h A on MMMM D, YYYY.') : item.status == "completed" ? 'Session closed' : ''}</Text>
                  </View>
                  <View style={{flex:1}} />            
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
    flex: 1,
    marginTop: 12,  
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
    marginTop: 2,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    textAlign: 'left',
    color: theme.colors.sectionHeader,    
  },
}) 