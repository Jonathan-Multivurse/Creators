import React, { Component } from 'react'
import { StyleSheet, Platform, View, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Image, Modal, FlatList, ScrollView, Alert} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'
import SURVEY_DB from '../api/surveyDB'
import { sin } from 'react-native-reanimated'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

const questionTypes = [{title: 'Text', image: require('../assets/images/survey/icon_Text.png')}, {title: 'Dropdown List', image: require('../assets/images/survey/icon_Dropdown.png')}, {title: 'Multiple Choice', image: require('../assets/images/survey/icon_Multiple.png')}, {title: 'Radio Options', image: require('../assets/images/survey/icon_Radio.png')}]

export default class SurveyNew extends Component {
  constructor(props) {
    super(props);   

    this.state = { 
      isLoading: false,
      title: '',
      description: '',   
      titleError: '', 
      descriptionError: '',     
      modalVisible: false,
      questions: [],
    }
  }

  onSavePressed = () => {
    const titleError = nameValidator(this.state.title)
    const descriptionError = nameValidator(this.state.description)

    if (titleError || descriptionError) {
      this.setState({
        titleError: titleError,
        descriptionError: descriptionError,
      })

      Alert.alert(
        "Survey Creating Error",
        "You must type Survey Name and Description!"
      );

      return
    }

    this.setState({
      isLoading: true,
    })

    SURVEY_DB.addSurvey(this.state.title, this.state.description, this.state.questions, 0, this.onUserSuccess);
  }

  onUserSuccess= async () => {    
    this.setState({
      isLoading: false,
      titleError: '',
      descriptionError: '',
    })

    this.props.navigation.goBack()   
  };

  onModal = (visible) => {
    this.setState({ modalVisible: visible });         
  }

  selectType = (type) => {
    this.setState({ modalVisible: false });  

    this.props.navigation.navigate('SurveyQuestionEdit', {
      question: {
        title: '',
        type: type.title,
        options: []
      },
      sIndex: -1,
      onGoBackFromOptions: (item, index) => this._onGoBackFromOptions(item, index),
    })
  }

  _onGoBackFromOptions = (item, index) => {
    if (item) {
      let questions = this.state.questions
      if (index == -1){
        questions.push(item)
      } else {
        questions.splice(index, 1)
        questions.splice(index, 0, item)
      }
      
      this.setState({
        questions: questions,    
      })
    }
  }

  editQuestion = (index) => {
    let questions = this.state.questions
    let item = questions[index]

    this.props.navigation.navigate('SurveyQuestionEdit', {
      question: item,
      sIndex: index,
      onGoBackFromOptions: (item, index) => this._onGoBackFromOptions(item, index),
    })
  }

  duplicateQuestion = (index) => {
    let questions = this.state.questions
    let item = questions[index]
    questions.splice(index, 0, item)

    this.setState({questions: questions})
  }

  removeQuestion = (index) => {
    let questions = this.state.questions
    questions.splice(index, 1)

    this.setState({questions: questions})
  }

  render() {
    return (
      <Background>

        <Modal
          animationType='fade'
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.onModal(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {styles.modalView}>
              <FlatList
                data={questionTypes}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (
                    <TouchableOpacity onPress={() => this.selectType(item)} style={{...styles.cellView,  borderBottomWidth: index < 3 ? 1 : 0 }}>
                      <Image style={styles.iconImage} source={ item.image }/>
                      <Text style={styles.nameText}>{item.title}</Text>
                    </TouchableOpacity>
                )}
              /> 
            </View>  
            <TouchableOpacity style={styles.cancelButton} onPress={() => this.onModal(false)}>
              <Text style={styles.nameText}>Cancel</Text>
            </TouchableOpacity>            
          </View>

        </Modal>

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>New Survey</PageTitle>
        </View>

        <View style = {styles.contentView}>  
            <Text style={styles.emailText}>Survey Name</Text>
            <TextInput
                style={styles.emailInput}
                value={this.state.title}
                onChangeText={ (text) => this.setState({title: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
            />
            <Text style={styles.passwordText}>Description</Text>
            <TextInput
                style={styles.emailInput}
                value={this.state.description}
                onChangeText={ (text) => this.setState({description: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
            />
            <View style={{width: DEVICE_WIDTH, height: 1, marginTop: 19, backgroundColor: '#D1D1D6'}}/>

            <ScrollView style={{height: DEVICE_HEIGHT - 540, width: DEVICE_WIDTH }} nestedScrollEnabled={true}>
              <Text style={styles.questiondText}>Questions</Text>
              {this.state.questions.map((question, index) => 
                (<View style={styles.questionCellView} key={index}>
                    <Text style={styles.titleText}>{question.title}</Text>

                    <View style={styles.typeView}>
                      <Image style={styles.typeImage} source={ question.type == 'Text' ? require('../assets/images/survey/icon_Text.png') : question.type == 'Dropdown List' ? require('../assets/images/survey/icon_Dropdown.png') : question.type == 'Multiple Choice' ? require('../assets/images/survey/icon_Multiple.png') : require('../assets/images/survey/icon_Radio.png') }/>
                      <Text style={styles.typeText}>{question.type}</Text>
                    </View>

                    <View style={{width: DEVICE_WIDTH - 64, height: 1, marginTop: 8, marginLeft: 16, backgroundColor: '#D1D1D6'}}/>

                    {question.type == 'Text' ? 
                      null : 
                      ( <View style={styles.optionsView}>
                        { question.options.map((option, oIndex) => ( <Text key={oIndex} style={styles.optionText}>{option}</Text> ) )}                        
                        </View> 
                      )
                    }

                    <View style={styles.buttonsView}>
                      <TouchableOpacity onPress={() => this.editQuestion(index)} style={styles.removeView}>
                          <Text style={styles.buttonText}>Edit</Text>                           
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => this.duplicateQuestion(index)} style={styles.removeView}>
                          <Text style={styles.buttonText}>Duplicate</Text>                           
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => this.removeQuestion(index)} style={styles.removeView}>
                        <Text style={styles.buttonText}>Remove</Text>                           
                      </TouchableOpacity>                   
                    </View>                    
                </View> ) 
              )}

              <TouchableOpacity style={styles.addButton} onPress={() => this.onModal(true)}>
                  <Image style={{height: 25, width: 152}} source={require('../assets/images/survey/add_question.png')}/>
              </TouchableOpacity>
            </ScrollView>                  

            <View style={styles.saveView}>
              <TouchableOpacity style={styles.loginButton} onPress={() => this.onSavePressed()}>
                <Text style={styles.loginText}>Save</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  emailText: {
    height: 20,
    marginTop: 36,
    marginBottom: 7,
    marginLeft: 16,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  emailInput: {
    width: DEVICE_WIDTH - 32,
    height: 44,
    marginHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  passwordText: {
    marginTop: 16,
    marginBottom: 7,
    marginLeft: 16,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  questiondText: {
    marginLeft: 16,
    marginTop: 23,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  addButton: {
    width: DEVICE_WIDTH,
    height: 40,
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveView: {
    width: DEVICE_WIDTH,
    flex : 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.inputBack
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 20,
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

  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: theme.colors.shadow
  },

  modalView: {    
    width: DEVICE_WIDTH - 16,
    borderRadius: 14,
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

  cellView: {
    height: 56,
    width: DEVICE_WIDTH - 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: theme.colors.shadow,
      
  },

  iconImage: {
    width: 26,
    height: 26,    
    position: 'absolute',
    left: 16,
    top: 15, 
  },

  nameText: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 24,    
    fontFamily: 'Poppins-Medium',
    color: theme.colors.blue,
  },

  cancelButton: {
    height: 56,
    width: DEVICE_WIDTH - 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',    
    backgroundColor: "white", 
  },

  questionCellView: {
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginTop: 6,
    marginBottom: 6, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.shadow,

    justifyContent: 'flex-start',  
    
  },

  titleText: {
    marginLeft: 16,
    marginRight: 16,
    marginTop: 8,
    textAlign: 'left',
    fontSize: 17,
    lineHeight: 24,    
    fontFamily: 'Poppins-SemiBold',
  },

  typeView: {
    marginLeft: 16,
    marginTop: 8,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center'
  },

  typeImage: {
    width: 26,
    height: 26,
  },

  typeText: {
    marginLeft: 8,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  },

  optionsView: {
    width: DEVICE_WIDTH - 64,
    marginLeft: 16,
    borderBottomColor: '#D1D1D6',
    borderBottomWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'flex-start'
  },

  optionText: {
    height: 32,
    textAlign: 'center',
     fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },

  buttonsView: {
    height: 50,
    width: DEVICE_WIDTH - 64,
    marginLeft: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },

  buttonText: {
     textAlign: 'center',
     fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightYellow,
  }  

})
