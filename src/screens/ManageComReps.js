import React, { Component } from 'react'
import { View, StyleSheet, Platform, Image, Dimensions, Text, FlatList, LogBox, TouchableOpacity, ActivityIndicator, Alert} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import {firebase} from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import RatingView from '../components/RatingView'

const DEVICE_WIDTH = Dimensions.get('window').width

getUserRatings = (user) => {
    if (user.rating) {
        const repRatings = user.rating;
        var userRating = 0  
        if (repRatings.length > 0) {
            let sum = 0
            for(let i = 0; i < repRatings.length; i++){
              let tmp = repRatings[i]
              sum += tmp.star
            }
            
            userRating = (sum/repRatings.length).toFixed(1)
        }      
        return userRating
    } else {
        return 0
    }
}

export default class ManageComReps extends Component {
    constructor(props) {
        super(props)

        this._unsubscribeFocus = null; 
        this._observer = null;  

        this.state = { 
          isLoading: false,    
          cUsers: [],
        }
    }

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);

        this._unsubscribeFocus = this.props.navigation.addListener("focus", () => {
            this.getComReps();
        });

        const userID = firebase.auth().currentUser.uid;
        this._observer = firestore().collection('notification').where('receivers', 'array-contains', userID)
        .onSnapshot(querySnapshot => {
            if (querySnapshot.docChanges().length > 0){
                this.getComReps();
            }      
        });
    }

    getComReps = async() => {

        const adminID = firebase.auth().currentUser.uid;

        this.setState({
            isLoading: true,
        });

        fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getFullReps', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userid: adminID,
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
                cUsers: responseJson.reps
            })    
        })
        .catch((err) => {        
            this.setState({
                isLoading: false,
            });
            Alert.alert('Network Error', 'Please check your network connection and try again.')
        });
    }

    componentWillUnmount() {
        this._observer();
    }

    goSearch = () => {
        this.props.navigation.navigate('ManageComRepsSearch', {
            cUsers: this.state.cUsers
        });
    }

    selectRep = (item) => {
        this.props.navigation.navigate('ManageComProfile', {
            rep: item
        });
    }

    render() {
        return (
            <Background>

                <View style = {styles.navigationView}>      
                    <BackButton goBack={() => this.props.navigation.goBack()} />
                    <PageTitle>Manange</PageTitle>
                    <View style={{flex: 1}}/>
                    <TouchableOpacity style={styles.rightButton} onPress={() => this.goSearch()} >
                        <Image style={styles.searchImage} source={require('../assets/images/support/search_blue.png')}/>
                    </TouchableOpacity>
                </View>
    
                <View style={styles.listView}>
                    <FlatList
                        contentContainerStyle={{paddingBottom: 24,}}
                        data={this.state.cUsers}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({item}) => (
                            <TouchableOpacity onPress={() => this.selectRep(item)} style={styles.cellView}>
                                <View style={styles.cellContentView}>

                                    <View style={styles.profileImageView}>
                                        <Image source={{uri : item.image}} style={styles.profileImage} />
                                    </View>

                                    <View style={styles.contentView}>
                                        <Text style={styles.nameText}>{item.firstname + " " + item.lastname}</Text>

                                        <View style={styles.ratingView}>
                                            <RatingView star={getUserRatings(item)} type={2} />
                                            <Text style={styles.ratingText}>{item.rating ? '(' + item.rating.length.toString() + ')' : ''}</Text>
                                        </View>

                                    </View>
                                </View>
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
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexDirection: 'row',
    },
  
    rightButton: {
        width: 50,
        height: 50,
        marginRight: 0,
        paddingLeft: 12,
        paddingTop: 22,
    },

    searchImage: {
        width: 18,
        height: 18,
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

    ratingView: {
        height: 16,
        flexDirection: 'row',
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