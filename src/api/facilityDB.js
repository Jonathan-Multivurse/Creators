import firestore from '@react-native-firebase/firestore'

const facilityCollection = firestore().collection('facility');
const usersCollection = firestore().collection('users');

const FACILITY_DB = {
  addFacility: async (title, userAction) => {  
    const docid = facilityCollection.doc().id

    facilityCollection
    .doc(docid)
    .set({
      title: title,
      facilityid: docid,
      facilityCode: '',
      date: new Date().getTime(),
      simulators: [],
      branch:[]
    })
    .then(() => {
      userAction()
    })
  },

  updateFacility: async (docID, title, userAction) => {
    facilityCollection
    .doc(docID)
    .update({
      title: title,
      date: new Date().getTime()
    })
    .then(() => {
      console.log('Facility updated!');
      userAction()
    });        
  },

  updateDFacility: async (docID, values, userAction) => {   
    facilityCollection
    .doc(docID)
    .update(values)
    .then(() => {
      console.log('Facility updated!');
      userAction()
    });        
  },

  deleteFacility: async (docID, userAction) => {   
    facilityCollection
    .doc(docID)
    .delete()
    .then(() => {
      console.log('Facility deleted!');
      userAction()
    });        
  },

  getFacilities: async (userAction) => {
    facilityCollection
    .orderBy('title')
    .get()
    .then(querySnapshot => {      
      const facilities = []
      querySnapshot.forEach(documentSnapshot => {
        facilities.push({...documentSnapshot.data()})
      });

      facilities.sort(function(first, second)  {
        const fTitle = first.title.toUpperCase()
        const sTitle = second.title.toUpperCase()
        if (fTitle < sTitle) {
          return -1;
        }
        if (fTitle > sTitle) {
          return 1;
        }
        return 0;
      })
      userAction(facilities)
    });      
  },    

  getTestFacilities: async () => {
    
    const facilityQuerySnapshot = await
    facilityCollection
    .orderBy('title')
    .get()

    const aryNames = []
    const aryMakes = []
    const aryModels = []
    const arySerials = []

    // const batch = firestore().batch();

    facilityQuerySnapshot.forEach(documentSnapshot => {      
      const facility = documentSnapshot.data()

      if(facility.simulators && facility.simulators.length > 0 ) {
        const simulators = facility.simulators

        simulators.forEach((simulator, index) => {
          if (!aryNames.includes(simulator.name)){
            aryNames.push(simulator.name)
          }

          if (!aryMakes.includes(simulator.make)){
            aryMakes.push(simulator.make)
          }

          if (!aryModels.includes(simulator.model) && (simulator.name != simulator.model)){
            aryModels.push(simulator.model)
          }

          if (!arySerials.includes(simulator.serial)){
            arySerials.push(simulator.serial)
          }

          // simulators.splice(index, 1)
          // simulators.splice(index, 0, tmpSimulator)
        })

        // batch.update(documentSnapshot.ref, 'simulators', simulators);
      }
    })

    console.log('Simulator Names ====>', aryNames)
    console.log('Simulator Makes ====>', aryMakes)
    console.log('Simulator Models ====>', aryModels)
    console.log('Simulator Serials ====>', arySerials)

    // return batch.commit();    
  },   

  getFacilitiesWithEmployees: async (userAction) => {
    facilityCollection
    .orderBy('title')
    .get()
    .then(querySnapshot => {

      var facilities = []
      querySnapshot.forEach(documentSnapshot => {
        facilities.push({...documentSnapshot.data()})
      });

      facilities.sort(function(first, second)  {
        const fTitle = first.title.toUpperCase()
        const sTitle = second.title.toUpperCase()
        if (fTitle < sTitle) {
          return -1;
        }
        if (fTitle > sTitle) {
          return 1;
        }
        return 0;
      })

      usersCollection
      .where('type', '==', 'customer')
      .get()
      .then(userSnapshot => {

        const customers = []
        userSnapshot.forEach(documentSnapshot => {
          customers.push({...documentSnapshot.data()})
        });
        
        facilities.forEach((facility, facIndex) => {
          var tmpCustomers = []          
          const tmpID = facility.facilityid
          customers.forEach((user, index) => {
            if (user.facility && user.facility === tmpID ){
              tmpCustomers.push(user)
              customers.splice(index, 1)
            }
          })

          facilities.splice(facIndex, 1)
          facilities.splice(facIndex, 0, {...facility, employees: tmpCustomers})
        });

        userAction(facilities)
      });
    });      
  }, 
};

export default FACILITY_DB;