import React, { Component } from 'react'
import { View, StyleSheet, Platform, Image, Dimensions, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'
import RatingView from '../components/RatingView'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class ManageComRepsSearch extends Component {
constructor(props) {
  super(props)

  this.state = { 
    isLoading: false,    
    originalData: this.props.route.params.cUsers,
    filteredData: this.props.route.params.cUsers,
  }
}

searchFilter = (text) => {
  if (text) {
    const newData = this.state.originalData.filter(
      function(item){
        const itemData = (item.firstname + " " + item.lastname).toUpperCase()
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
            placeholderStyle={{fontFamily: 'Poppins-Regular', fontSize: 16,}}
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

                <View style={styles.profileImageView}>
                  <Image source={{uri : item.image}} style={styles.profileImage} />
                </View>

                <View style={styles.contentView}>
                  <Text style={styles.nameText}>{item.firstname + " " + item.lastname}</Text>

                  <RatingView star={getUserRatings(item)} type={2}/>
                </View>
              </View>
          </View>
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
}}

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
    width: DEVICE_WIDTH,
    flex: 1,
    marginTop: 20,  
  },

  listView: {
    width: DEVICE_WIDTH,
    flex: 1,
    marginTop: 20,  
  },

  cellView: {
    width: DEVICE_WIDTH,
    height: 83,
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
    width: 53,
    height: 53,
    marginLeft: 12,    
    borderRadius: 26.5,
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
    width: 53,
    height: 53,
    
    borderRadius: 26.5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  
  contentView: {
    flex: 1,
    margin: 12,
  },
  
  nameText: {
    marginTop: 5,
    fontSize: 16,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },
 
  ratingText: {
    height: 22,
    marginLeft: 2,
    paddingTop: 4,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray, 
  },    
}) 