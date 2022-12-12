import auth, {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'

const surveysCollection = firestore().collection('survey');

const SURVEY_DB = {
  addSurvey: async (title, description, questions, status, userAction) => {     
    const docid = surveysCollection.doc().id

    const doc = {
      surveyId: docid,
      title: title,
      description: description,
      questions: questions,
      status: status,        
      submissions: 0,
      date: new Date().getTime(),      
    }

    await surveysCollection
    .doc(docid)
    .set(doc)
    .then(() => {
      userAction()
    })
  },

  updateSurvey: async (docID, title, description, questions, status, submissions, userAction) => {
    surveysCollection
      .doc(docID)
      .update({
        title: title,
        description: description,
        questions: questions,
        status: status,        
        submissions: submissions,
        date: new Date().getTime()
      })
      .then(() => {
          console.log('Survey updated!');
          userAction()
      });        
  },

  updateDSurvey: async (docID, values, userAction) => {   
    surveysCollection
    .doc(docID)
    .update(values)
    .then(() => {
        console.log('Survey updated!');
        userAction()
    });        
  },

  deleteSurvey: async (docID, userAction) => {   
    surveysCollection
    .doc(docID)
    .delete()
    .then(() => {
        console.log('Survey deleted!');
        userAction()
    });        
  },

  getSurveys: async (userAction) => {
    surveysCollection
      .orderBy('status')
      .get()
      .then(querySnapshot => {
        console.log('Total Surveys: ', querySnapshot.size);
        
        const surveys = []
        querySnapshot.forEach(documentSnapshot => {
            surveys.push({...documentSnapshot.data()})
        });
        userAction(surveys)
    });      
  },   
  
  getAnswers: async (surveyId, userAction) => {
    console.log(surveyId)
    surveysCollection
      .doc(surveyId)
      .collection('answers')
      .get()
      .then(querySnapshot => {        
        const answers = []
        querySnapshot.forEach(documentSnapshot => {
          answers.push({...documentSnapshot.data()})
        });
        userAction(answers)
    });      
  },  
  
};

export default SURVEY_DB;