import React, { Component } from 'react'
import { View, StyleSheet, Platform, Image, Dimensions, TouchableOpacity, Text, SectionList, ActivityIndicator, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import RatingView from '../components/RatingView'
import { theme } from '../core/theme'
import {firebase} from "@react-native-firebase/auth"
import USER_DB from '../api/userDB'
import moment from 'moment';

const DEVICE_WIDTH = Dimensions.get('window').width

export default class RatingReviewScreen extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isLoading: false,
      ratings: this.props.route.params.ratings,

      isSelect: false,
      arySelected: [],
      isSelectAll: false
    };   

    USER_DB.getRating(this.onUserRating) 
  }

  onUserRating = (rating) => {
    if (rating && rating.rating){
      this.setState({
        ratings: rating.rating,
      })
    }
  } 

  // Delete Notifications
  select = async() => {
    const tmpSelect = !this.state.isSelect

    this.setState({
      isSelect: tmpSelect,
      arySelected: [],
      isSelectAll: false
    })
  }

  selectAll = async() => {
    const tmpSelectAll = !this.state.isSelectAll
    var arraySelected = []

    if (tmpSelectAll){
      this.state.ratings.forEach((rating, index) => {
        arraySelected.push(rating.requestId)
      })
    } else {
      arraySelected = []
    }

    this.setState({
      isSelectAll: tmpSelectAll,
      arySelected: arraySelected
    })
  }

  selectedNotification = async(ratingID) => {
    var arraySelected = this.state.arySelected
    if (arraySelected.includes(ratingID)) {
      const index = arraySelected.indexOf(ratingID)
      arraySelected.splice(index, 1);
    } else {
      arraySelected.push(ratingID)
    }
    
    this.setState({arySelected: arraySelected})
  }

  deleteConfirm = async() => {
    const iCount = this.state.arySelected.length
    if (iCount > 0) {
      const title = iCount == 1 ? 'Delete 1 Rating & Review' : 'Delete ' + String(iCount) + ' Ratings & Reviews' 
      Alert.alert(
        title,
        `You can not redrive the rating & review once deleted.`,
        [
          {
            text: "Cancel",
            onPress: () => {},
          },
          {
            text: "Delete",
            onPress: () => {
              this.setState({
                isLoading: true
              })

              this.deleteRatings()              
            },
          },
          
        ],
        { cancelable: false }
      );
    } else {      
      Alert.alert(
        'Warnning',
        `Please select rating & review to delete.`,
        [
          {
            text: "Ok",
            onPress: () => {
            },
          },
        ],
        { cancelable: false }
      );
    }    
  }

  deleteRatings = async() => {
    const userID = firebase.auth().currentUser.uid;
    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/deleteRatings', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        requestIds: this.state.arySelected,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isLoading: false,
        isSelect: false
      });

      if (responseJson.statusCode !== 200) {        
        // alert(responseJson.error);
        return;
      }

      USER_DB.getRating(this.onUserRating)
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
        isSelect: false
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });    
  }

  render() {
    const repRatings = this.state.ratings;  
    var repRatingsData = [];
    var todayData = [];
    var earlierData = [];

    for(let i = 0; i < repRatings.length; i++){
        let tmp = repRatings[i]
        const diff = new Date().getTime() - tmp.time;
        if (diff < 24 * 3600) {
            todayData.push(tmp)
        } else {
            earlierData.push(tmp)
        }        
    }

    if (todayData.length > 0 ) {
        repRatingsData.push({
        title: "Today",
        data: todayData,
      })
    }

    if (earlierData.length > 0 ) {
        repRatingsData.push({
        title: "Earlier",
        data: earlierData,
      })
    }

    return (
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Ratings & Reviews</PageTitle>          
        </View>

        <View style = {styles.buttonView}> 
          { this.state.isSelect && this.state.ratings.length > 0 &&
            <TouchableOpacity onPress={this.selectAll} style={styles.selectAllContainer}>
              <Text style={styles.selectAllText}>{this.state.isSelectAll ? 'Deselect All' : 'Select All'}</Text>
            </TouchableOpacity>
          }
          <View style={{flex: 1}} />
          {this.state.isSelect ? 
            <TouchableOpacity onPress={this.deleteConfirm} style={styles.deletecontainer}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity> 
            : <View/>
          } 

          <TouchableOpacity onPress={this.select} style={styles.selectContainer}>
            <Text style={styles.selectText}>{this.state.isSelect ? 'Done' : 'Select'}</Text>
          </TouchableOpacity>

        </View>

        <View style={styles.listView}>            
            <SectionList
              contentContainerStyle={{paddingBottom: 24}}            
              sections={repRatingsData}
              keyExtractor={(item, index) => item + index}
              renderItem={({item, index}) => (

                <View style= {styles.cellView}>
                  { this.state.isSelect
                    ?<TouchableOpacity onPress={() => this.selectedNotification(item.requestId)} style={styles.optionView} >
                      { this.state.arySelected.includes(item.requestId) 
                        ? <Image source={require('../assets/images/home/icon_option.png')} style={styles.optionImage}/>
                        : <View style={styles.iconView} />
                      }                    
                    </TouchableOpacity> 
                    :<View/>
                  }

                  <View key={index} style={styles.vItem}>
                    <RatingView star={item.star} type={0}/>                    

                    <Text style={styles.nameText}>{item.writerName}</Text>
                    {item.review == "" 
                      ? <View/> 
                      : <Text style={styles.reviewText}>{item.review}</Text>
                    }
                     
                  </View>    
                </View>
              )}
              renderSectionHeader={({ section: { title } }) => (
                <View style = {styles.sectionView}>
                  <Text style={styles.todayText}>{title}</Text>
                </View>
              )}
            />
        </View>

        {this.state.isLoading ? (
            <ActivityIndicator
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
    // backgroundColor: theme.colors.inputBar
  },  

  listView: {
    width: DEVICE_WIDTH,
    flex: 1,
  },

  sectionView: {
    width: '100%',
    height: 30,
    backgroundColor: 'white',
  },

  todayText: {
    marginTop: 12, 
    marginLeft: 16,
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.sectionHeader
  },

  cellView: {
    width: DEVICE_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
  },

  vItem: {
    marginLeft: 16,
    width: DEVICE_WIDTH - 32,
    marginTop: 6,
    marginBottom: 6,      
    paddingBottom: 12,                
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    justifyContent: 'flex-start',  
  },

  nameText: {
    marginTop: 10,
    marginLeft: 12,
    fontSize: 15,    
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
  },

  reviewText: {
    marginLeft: 12,
    marginTop: 2,
    fontSize: 14,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },

  buttonView: {
    width: '100%',
    height: 40,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },

  selectAllContainer: {
    width: 120,
    height: 40,
  },

  selectAllText: {  
    marginTop: 9,
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.primary, 
  },

  deletecontainer: {
    width: 70,
    height: 40,
    marginRight: 16, 
  },

  selectContainer: {
    width: 60,
    height: 40,
    marginRight: 16,  
  },

  deleteText: {
    marginTop: 9, 
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.redColor, 
  },

  selectText: {
    marginTop: 9,   
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.darkBlue, 
  },

  optionView: {
    width: 40,   
    height: 50,
    paddingLeft: 16,     
    alignItems: 'center',
    flexDirection: 'row',
  },

  optionImage:{
    width: 22,
    height: 22,
  },

  iconView: {
    width: 22,
    height: 22,
    borderColor: theme.colors.darkBlue,
    borderWidth: 1.5,
    borderRadius: 11,
  },
})