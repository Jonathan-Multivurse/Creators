import React, { Component } from 'react'
import { StyleSheet, Platform, View, TouchableOpacity, Text, Dimensions, ActivityIndicator, ScrollView} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import SURVEY_DB from '../api/surveyDB'
import Share from "react-native-share"

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

const questionTypes = [{title: 'Text', image: require('../assets/images/survey/icon_Text.png')}, {title: 'Dropdown List', image: require('../assets/images/survey/icon_Dropdown.png')}, {title: 'Multiple Choice', image: require('../assets/images/survey/icon_Multiple.png')}, {title: 'Radio Options', image: require('../assets/images/survey/icon_Radio.png')}]

const url = "https://www.echo.healthcare/support";
const title = "Survey";
const message = "Share Survey.";

const options = {
  title,
  url,
  message,
};

export default class SurveyAnalyzeScreen extends Component {
  constructor(props) {
    super(props);   
    SURVEY_DB.getAnswers(this.props.route.params.survey.surveyId, this.onGetAnswers)

    this.state = { 
      isLoading: false,
      survey: this.props.route.params.survey,
      questions: [],

      modalVisible: false,
    }
  }

  onGetAnswers = (answers) => {
    var aryQuestions = this.props.route.params.survey.questions
    const questions = this.props.route.params.survey.questions

    questions.forEach((question, qIndex) => {
      var tmpQuestion = question
      const questionType = question.type      

      if (questionType === 'Dropdown List' || questionType === 'Radio Options'){
        var aryAnswers = []
        tmpQuestion.options.forEach((option) => {
          aryAnswers.push(0)
        })
        
        tmpQuestion.options.forEach((option, oIndex) => {
          answers.forEach(answer => {        
            if (option === answer.answers[qIndex]){
              aryAnswers[oIndex] = aryAnswers[oIndex] + 1
            }      
          })
        })

        tmpQuestion.totalCount = answers.length == 0 ? 1 : answers.length
        tmpQuestion.answers = aryAnswers
        aryQuestions.splice(qIndex, 1)
        aryQuestions.splice(qIndex, 0, tmpQuestion)
      } else if (questionType == 'Text') {
        var aryAnswers = []
        answers.forEach(answer => {        
          aryAnswers.push(answer.answers[qIndex])        
        })

        if (aryAnswers.length > 5) {
          tmpQuestion.showMore = true
        } else {
          tmpQuestion.showMore = false
        }      
  
        tmpQuestion.answers = aryAnswers
        aryQuestions.splice(qIndex, 1)
        aryQuestions.splice(qIndex, 0, tmpQuestion)
      } else if (questionType === 'Multiple Choice' ) {
        var aryAnswers = []
        var totalCount = 0

        tmpQuestion.options.forEach((option) => {
          aryAnswers.push(0)
        })
        
        tmpQuestion.options.forEach((option, oIndex) => {
          answers.forEach(answer => {        
            const mAnswer = answer.answers[qIndex]
            const mAnswers = mAnswer.split(',');
            console.log("mAnsesrs  ==>", mAnswers)
            mAnswers.forEach(mAnswer => {                
              if (option === mAnswer){
                totalCount = totalCount + 1
                aryAnswers[oIndex] = aryAnswers[oIndex] + 1
              }
            })                  
          })
        })

        tmpQuestion.totalCount = totalCount == 0 ? 1 : totalCount
        tmpQuestion.answers = aryAnswers
        aryQuestions.splice(qIndex, 1)
        aryQuestions.splice(qIndex, 0, tmpQuestion)
      }
    });

    this.setState({
      questions: aryQuestions,
    })    
  } 

  showMore = async(index) => {
    
    var tmpQuestions = this.state.questions
    var tmpQuestion = tmpQuestions[index]
    tmpQuestion.showMore = false

    console.log("index", index, tmpQuestion)

    tmpQuestions.splice(index, 1)
    tmpQuestions.splice(index, 0, tmpQuestion)  

    this.setState({
      questions: tmpQuestions,
    }) 
  }

  unlessMore = async(index) => {
    
    var tmpQuestions = this.state.questions
    var tmpQuestion = tmpQuestions[index]
    tmpQuestion.showMore = true

    console.log("index", index, tmpQuestion)

    tmpQuestions.splice(index, 1)
    tmpQuestions.splice(index, 0, tmpQuestion)  

    this.setState({
      questions: tmpQuestions,
    }) 
  }

  onSharePress = async() => {
    Share.open(options)
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      err && console.log(err);
    });
  }

  render() {
    return (
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>{this.state.survey.title}</PageTitle>

          <TouchableOpacity style={styles.rightButton} onPress={this.onSharePress} >
            <Text style={styles.rightText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentView} nestedScrollEnabled={true}>
          {this.state.questions.map((question, qIndex) => 
            (<View style={styles.questionCellView} key={qIndex}>
              <Text style={styles.titleText}>{question.title}</Text>
              <View style={{marginLeft: 16, marginRight: 16, height: 1, marginTop: 10,  backgroundColor: '#D1D1D6'}}/>

              {question.type == 'Text' ? 
                ( question.answers.length > 5 ? question.showMore ?
                  <View style={styles.optionsView}>
                    { question.answers.map((answer, aIndex) => 
                      (
                        (aIndex < 5) && (<View style={styles.optionView} key={aIndex}>
                          <Text style={styles.optionText}>{answer}</Text>                       
                        </View>)
                      ) 
                    )}
                    <TouchableOpacity style={styles.showMore} onPress={() => this.showMore(qIndex)} >
                      <Text style={styles.showMoreText}>Show More</Text>    
                    </TouchableOpacity>                       
                  </View> 
                : <View style={styles.optionsView}>
                    { question.answers.map((answer, aIndex) => 
                      (
                        <View style={styles.optionView} key={aIndex}>
                          <Text style={styles.optionText}>{answer}</Text>                       
                        </View>
                      ) 
                    )}    
                    <TouchableOpacity style={styles.showMore} onPress={() => this.unlessMore(qIndex)} >
                      <Text style={styles.showMoreText}>Unless</Text>    
                    </TouchableOpacity>                     
                  </View>
                : <View style={styles.optionsView}>
                  { question.answers.map((answer, aIndex) => 
                    (
                      <View style={aIndex === question.answers.length - 1 ? styles.optionView1 : styles.optionView} key={aIndex}>
                        <Text style={styles.optionText}>{answer}</Text>                       
                      </View>
                    ) 
                  )}                        
                  </View>
                )
              :(<View style={styles.optionsView}>
                  { question.options.map((option, oIndex) => 
                    (
                      <View style={oIndex === question.options.length - 1 ? styles.optionView1 : styles.optionView} key={oIndex}>
                        <Text style={styles.optionText}>{option}</Text>
                        <View style={{flex: 1}}/>
                        <View style={{...styles.resultView, 
                          backgroundColor: (100 * question.answers[oIndex]/question.totalCount) < 10 ? '#8E8E93' : 
                          (100 * question.answers[oIndex]/question.totalCount) < 20 ? '#C13018' : 
                          (100 * question.answers[oIndex]/question.totalCount) < 30 ? '#F36F13' : 
                          (100 * question.answers[oIndex]/question.totalCount) < 40 ? '#EBCB37' : '#A2B969' }}
                        >
                          <Text style={styles.resultText}>{(100 * question.answers[oIndex]/question.totalCount).toFixed(0)}%</Text>
                        </View>                        
                      </View>
                    ) 
                  )}                        
                </View>)
              }                 
            </View> 
            ) 
          )}
        </ScrollView>                  


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

  rightButton: {
    width: 90,
    height: 50,
    position: 'absolute',
    right: 8,
    bottom: 0,
    paddingBottom: 6,
    paddingLeft: 22,
    justifyContent: 'flex-end',
  },
  
  rightText: {
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: theme.colors.primary,
  },

  contentView: {
    width: '100%',
    flex: 1,
    marginTop: 24,
  },

  questionCellView: {
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginTop: 6,
    marginBottom: 6, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,

    justifyContent: 'flex-start',      
  },

  titleText: {
    marginLeft: 16,
    marginRight: 16,
    marginTop: 16,

    textAlign: 'left',
    fontSize: 17,
    lineHeight: 24,    
    fontFamily: 'Poppins-SemiBold',
  },

  optionsView: {
    marginLeft: 16,
    marginRight: 16,

    paddingBottom: 6,
    alignItems: 'flex-start',
  },

  optionView: {
    marginLeft: 0,
    width: DEVICE_WIDTH - 64,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBorder,
    flexDirection: 'row',

    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },

  optionView1: {
    marginLeft: 0,
    width: DEVICE_WIDTH - 64,
    flexDirection: 'row',

    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },

  optionText: {
    textAlign: 'center',

    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },

  resultView: {
    marginRight: 1,
    height: 26,
    borderRadius: 13,  
  },

  resultText: {
    height: 24,
    textAlign: 'center',
    marginLeft: 9,
    marginRight: 8,
    marginTop: 2,

    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    color: 'white'
  },

  showMore: {
    height: 40,
    paddingRight: 10,
  },

  showMoreText: {
    marginTop: 12,
    marginBottom: 6,

    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',    
    color: theme.colors.darkBlue,
    textDecorationLine: 'underline'
  }
})
