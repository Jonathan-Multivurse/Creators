import React, { Component } from 'react'
import { StyleSheet, Platform, View, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Image, Modal, FlatList, ScrollView, Alert} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

const questionTypes = [{title: 'Text', image: require('../assets/images/survey/icon_Text.png')}, {title: 'Dropdown List', image: require('../assets/images/survey/icon_Dropdown.png')}, {title: 'Multiple Choice', image: require('../assets/images/survey/icon_Multiple.png')}, {title: 'Radio Options', image: require('../assets/images/survey/icon_Radio.png')}]

export default class SurveyQuestionEdit extends Component {
  constructor(props) {
    super(props);   

    this.state = { 
      isLoading: false,
      title: this.props.route.params.question.title,
      type: this.props.route.params.question.type,  
      options: this.props.route.params.question.options,    
      modalVisible: false,
    }
  }

  onSavePressed = () => {
    const nameError = nameValidator(this.state.title)
    
    var optionError = true
    if (this.state.type == 'Text') {
      optionError = false
    } else {
      if (this.state.options.length > 0 ) {
        optionError = false
      }
    }

    if (nameError) {
      Alert.alert(
        "Quesiton Error",
        "You must type Question!"
      );
      return;
    }

    if ( optionError ) {
      Alert.alert(
        "Quesiton Error",
        "You must set options!"
      );
      return;
    }


    this.props.route.params.onGoBackFromOptions({
        title: this.state.title,
        type: this.state.type,
        options: this.state.options}, this.props.route.params.sIndex)
    this.props.navigation.goBack()
  }


  onModal = (visible) => {
    this.setState({ modalVisible: visible });         
  }

  selectType = (item) => {
    if (item.title == "Text") {
        this.setState({
            options: []
        })
    }

    this.setState({
        modalVisible: false,
        type: item.title
    })
  }

  updateRow = (item, index) => {
      let options = this.state.options
      options.splice(index, 1)
      options.splice(index, 0, item)
      this.setState({options: options})
  }

  removeRow = (index) => {
    let options = this.state.options
    options.splice(index, 1)

    this.setState({options: options})
    }

   addRow = (item) => {
    let options = this.state.options
    options.push(item)

    this.setState({options: options})
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
          <PageTitle>Edit</PageTitle>
          <TouchableOpacity onPress={() => this.onSavePressed()} style={styles.rightButton}>
            <Text style={styles.rightText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style = {styles.contentView}>  
            <Text style={styles.tileText}>Question</Text>
            <TextInput
                style={styles.titleInput}
                blurOnSubmit={true}
                multiline={true}
                value={this.state.title}
                onChangeText={ (text) => this.setState({title: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
            />
            <Text style={styles.answerText}>Answer Type</Text>
            <TouchableOpacity onPress={() => this.onModal(true)} style={styles.typeInput}>
                <Image style={styles.typeImage} source={ this.state.type == 'Text' ? require('../assets/images/survey/icon_Text.png') : this.state.type == 'Dropdown List' ? require('../assets/images/survey/icon_Dropdown.png') : this.state.type == 'Multiple Choice' ? require('../assets/images/survey/icon_Multiple.png') : require('../assets/images/survey/icon_Radio.png') }/>
                <Text style={styles.typeText}>{this.state.type}</Text>
                <View style={{flex: 1}}/>
                <Image style={styles.downImage} source={ require('../assets/images/survey/arrowDown.png') }/>
            </TouchableOpacity>

            <View style={{width: DEVICE_WIDTH - 32, height: 1, marginLeft: 16, marginTop: 19, backgroundColor: '#D1D1D6'}}/>

            {this.state.type == 'Text' ? 
                (<View style={{flex: 1}}/>) : 
                (<ScrollView style={{flex: 1, width: DEVICE_WIDTH, }} nestedScrollEnabled={true}>
                    <Text style={styles.questiondText}>Options</Text>    
                    {this.state.options.map((option, index) => 
                        (<View style={styles.optionCellView} key={index}>
                            <TextInput
                            style={styles.optionNameTextInput}
                            value={option}
                            onChangeText={(text) => this.updateRow(text, index)}
                            autoCapitalize="none"
                            autoCompleteType="name"
                            textContentType="name"
                            />
                            <TouchableOpacity onPress={() => this.removeRow(index)} style={styles.removeView}>
                                <Image style={styles.removeImage} source={ require('../assets/images/survey/icon_Remove.png') }/>                            
                            </TouchableOpacity>
                        </View> ) 
                    )}     

                    <TouchableOpacity style={styles.addButton} onPress={() => this.addRow('new option')}>
                        <Image style={{height: 25, width: 152}} source={require('../assets/images/survey/add_option.png')}/>
                    </TouchableOpacity>
                </ScrollView>)
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

  rightButton: {
    height: 50,
    position: 'absolute',    
    bottom: 0,
    right: 0,
    paddingBottom: 8,
    paddingRight: 16,
    justifyContent: 'flex-end',
  },

  rightText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: theme.colors.primary
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  tileText: {
    height: 20,
    marginTop: 36,
    marginBottom: 7,
    marginLeft: 16,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  titleInput: {
    width: DEVICE_WIDTH - 32,
    height: 67,
    marginHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  answerText: {
    marginTop: 16,
    marginBottom: 7,
    marginLeft: 16,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  typeInput: {
    width: DEVICE_WIDTH - 32,
    height: 44,
    marginHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  typeImage: {
    width: 26,
    height: 26,
    marginLeft: 16,
  },

  typeText: {
    marginLeft: 16,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },

  downImage: {
    height: 12,
    width: 20.5,    
    resizeMode: 'contain',
    alignSelf: 'center',
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
    marginTop: 0,
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionCellView: {
    height: 44,
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',   
    marginTop: 6,
    marginBottom: 6, 
  },

  optionNameTextInput: {
    width: DEVICE_WIDTH - 77,
    height: 44,
    marginHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: 'Poppins-Regular',
  },

  removeView: {
      alignItems: 'center',
      justifyContent: 'center',
  },

  removeImage: {
      marginRight: 16,
      width: 29,
      height: 29,
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
    top: 9, 
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

})
