import React, { Component } from 'react'
import { View, Platform, StyleSheet, Image, Dimensions, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import SURVEY_DB from '../api/surveyDB'
import firestore from '@react-native-firebase/firestore'
import moment from 'moment'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class SurveysScreen extends Component {
  constructor(props) {
      super(props)
      this._unsubscribeFocus = null;
      this._observer = null;

      this.state = { 
        isLoading: false,    
      }
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getSurveys();
    });

    this._observer = firestore().collection('survey').where('status', '==', 1)
    .onSnapshot(querySnapshot => {
      if (querySnapshot.docChanges().length > 0){
        this.getSurveys();
      }      
    });
  }

  componentWillUnmount() {    
      this._unsubscribeFocus();
      this._observer();
  } 

  getSurveys = () => {            
    this.setState({
      isLoading: true,
    });

    SURVEY_DB.getSurveys(this.onGetSurveys)         
  }

  onGetSurveys = (surveys) => {
    this.setState({
        isLoading: false,
      });
      
      this.setState({
        originalData: surveys,
        filteredData: surveys
    })
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
        filteredData: newData,
      })
    } else {
      this.setState({
        filteredData: this.state.originalData,
      })
    }
  }

  onCreatePressed = () => {
    this.props.navigation.navigate('SurveyNew')  
  }

  onSelectPressed = (item) => {
    if (item.status == 0){
      this.props.navigation.navigate('SurveyDetail', {
        survey: item
      }) 
    } else {
      this.props.navigation.navigate('SurveyActiveDetail', {
        survey: item
     })
    }      
  }

  render() {
    return (
      <Background>

        <View style = {styles.navigationView}>  
            <BackButton goBack={() => this.props.navigation.goBack()} />
            <PageTitle>Surveys</PageTitle>
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
          data={this.state.filteredData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
              <TouchableOpacity style={styles.cellContentView} onPress={() => this.onSelectPressed(item) }>
                  <View style={styles.contentView}>
                      <View style={styles.nameView}>
                        <Text style={styles.nameText}>{item.title}</Text>
                        <View  style={{flex: 1}}/>  
                        <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward_g.png')} />
                      </View> 
                      <Text style={styles.timeText}>{moment(item.date).format('MMM, DD, YYYY')}</Text>
                      <Text style={styles.timeText}>{item.submissions.toString() + ' Submissions'}</Text>
                      <View style={{...styles.statusView, backgroundColor: item.status == 2 ? '#FF3B30'  : item.status == 1 ? '#2BCC71' : '#EF8F35' }}>
                        <Text style={styles.statusText}>{item.status == 2 ? 'Completed'  : item.status == 1 ? 'Active' : 'Draft' }</Text> 
                      </View>                                              
                  </View>
              </TouchableOpacity>        

          )}
          /> 

          <View style={{flex: 1}}/>
          <TouchableOpacity style={styles.loginButton} onPress={() => this.onCreatePressed()}>
              <Text style={styles.loginText}>Create Survey</Text>
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
  
    searchView: {
        width: DEVICE_WIDTH - 32,
        height: 36,  
        marginTop: 12,  
        marginBottom: 12, 
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
      marginTop: 6,
      marginBottom: 6,
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
      alignItems: 'flex-start'
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

    arrowImage: {
        width: 10,
        height: 16,
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

    loginButton: { 
        width: DEVICE_WIDTH - 48,
        height: 57,
        marginLeft: 24,
        marginTop:12,
        marginBottom: 46,
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
        fontFamily: 'Poppins-Medium',
        color: 'white',
      },
  }) 