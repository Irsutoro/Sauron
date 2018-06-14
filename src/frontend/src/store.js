import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    loading: false,
    error: false,
    errorMessage: '',
    errorTimeout: {},
    logged: false,
    rooms: [],
    room: "",
    whitelists: [],
    whitelist: {},
    editWhitelist: {},
    students: [],
    student: {},
    userName: ""
  },
  mutations: {
    LOGIN(state, data) {
      state.logged = data
    },
    ERROR(state, message) {
      state.error = true
      state.errorMessage = message
      clearTimeout(state.errorTimeout)
      state.errorTimeout = setTimeout(() => {
        state.error = false
      }, 5000)
    },
    LOADING(state, data) {
      state.loading = data
    },
    UPDATE_ROOMS(state, rooms) {
      state.rooms = rooms
    },
    CHANGE_ROOM(state, roomName) {
      state.room = roomName
    },
    UPDATE_WHITELISTS(state, whitelists) {
      state.whitelists = whitelists
    },
    CHANGE_WHITELIST(state, selectedWhitelist) {
      state.whitelist = selectedWhitelist
    },
    EDIT_WHITELIST(state, whitelist) {
      state.editWhitelist = whitelist
    },
    updateEditWhitelistName(state, name) {
      state.editWhitelist.name = name
    },
    updateEditWhitelistAllowed(state, allowed) {
      state.editWhitelist.allowed = allowed
    },
    updateEditWhitelistGroup(state, group) {
      state.editWhitelist.group = group
    },
    UPDATE_STUDENTS(state, students) {
      state.students = students
    },
    CHANGE_STUDENT(state, student) {
      state.student = student
    },
    UPDATE_USER(state, userName){
      state.userName = userName
    }
  },
  actions: {
    login(context, credentials) {
      
      return new Promise((resolve, reject) => {
        context.commit('LOADING', true)
        context.commit('LOGIN', false)

        let authorization = 'Basic ' + window.btoa(`${credentials.login}:${credentials.password}`)
        window.sessionStorage.setItem('Authorization', authorization)
        
        axios
          .get("http://www.iraminius.pl/sauron/api/auth", {
            headers: {'Authorization': window.sessionStorage.getItem('Authorization')}
          })
          .then(res => {
            context.commit('LOGIN', true)
            context.commit('UPDATE_USER', credentials.login)
            context.commit('LOADING', false)
            resolve()
          })
          .catch(() => {
            context.commit('ERROR', 'Niepoprawne dane logowania')
            context.commit('LOADING', false)
            reject()
          });
      })
    },
    logout(context) {
      window.sessionStorage.removeItem('Authorization')
      context.commit('LOGIN', false)
      // axios
      //     .patch("http://iraminius.pl/sauron/api/whitelist",{},{
      //       headers: {'Authorization': window.sessionStorage.getItem('Authorization')},
      //       params:{
      //         id: selectedWhitelist.id,
      //         active: 0
      //       }
      // })
    },
    fetchRooms(context) {
      return new Promise((resolve, reject) => {
        context.commit('LOADING', true)        
      })
    },
    chooseRoom(context, roomName) {
      context.commit('CHANGE_ROOM', roomName)
    },
    fetchWhitelists(context) {
      return new Promise((resolve, reject) => {
        context.commit('LOADING', true)

        axios
          .get("http://iraminius.pl/sauron/api/whitelist",{
            headers: {'Authorization': window.sessionStorage.getItem('Authorization')},
            params:{
              user: this.state.userName,
              only_active: 0
            }
      })
          .then(res => {
            context.commit('UPDATE_WHITELISTS', res.data)

            context.commit('LOADING', false)
            resolve()
          })
          .catch(() => {
            context.commit('ERROR', 'Nie udało się pobrać listy grup')
            context.commit('LOADING', false)
            reject()
          });
      })
    },
    chooseWhitelist(context, selectedWhitelist) {
      return new Promise((resolve, reject) => {
      
      axios
          .patch("http://iraminius.pl/sauron/api/whitelist", {}, {
            headers: {'Authorization': window.sessionStorage.getItem('Authorization')},
            params:{
              id: this.state.whitelist.id,
              active: 0
            }})
      
      console.log(selectedWhitelist.name)
      console.log(selectedWhitelist.id)
      axios
          .patch("http://iraminius.pl/sauron/api/whitelist",{}, {
            headers: {'Authorization': window.sessionStorage.getItem('Authorization')},
            params:{
              id: selectedWhitelist.id,
              active: 1
            }
      })
      context.commit('CHANGE_WHITELIST', selectedWhitelist)
        })
    },
    editWhitelist(context, whitelist) {
      context.commit('EDIT_WHITELIST', whitelist)
    },
    deleteWhitelist(context, whitelist) {
      return new Promise((resolve, reject) => {
        context.commit('LOADING', true)
  
        axios
            .delete("http://iraminius.pl/sauron/api/whitelist", whitelist.id)
            .then(() => {
              context.dispatch('fetchWhitelists')
            })
            .catch(() => {
              context.commit('ERROR', 'Nie udało się usunąć listy')
              context.commit('LOADING', false)
              reject()
            });
          })
    },
    addWhitelist(context) {
      context.commit('EDIT_WHITELIST', {id: null, name: "Nowa lista", allowed: []})
    },
    saveWhitelist(context) {
      return new Promise((resolve, reject) => {
      context.commit('LOADING', true)
        console.log(context.state.editWhitelist.name)
      axios
          .post("http://iraminius.pl/sauron/api/whitelist",{},{
            headers:{'Authorization': window.sessionStorage.getItem('Authorization')},
            body:{
              name: context.state.editWhitelist.name,
              processes: context.state.editWhitelist.allowed,
              group: context.state.editWhitelist.group
            }
          })
          .then(() => {
            context.dispatch('fetchWhitelists')
          })
          .catch(() => {
            context.commit('ERROR', 'Nie udało się zapisać listy')
            context.commit('LOADING', false)
            reject()
          });
        })
    },
    fetchStudents(context) {
      return new Promise((resolve, reject) => {
        context.commit('LOADING', true)
        axios
          .get("http://www.iraminius.pl/sauron/api/process", {
            headers: {'Authorization': window.sessionStorage.getItem('Authorization')},
            params:{
              time_from: (Date.now() / 1000 - 7200 - 10).toFixed(0),
              time_to: (Date.now() / 1000 - 7200).toFixed(0),
              group: this.state.room
            }
          })
          .then(res => {
            let students = []

            res.data.forEach(nazgulFrame => {
              let studentIndex = students.findIndex(student => {
                return student.nazgul === nazgulFrame.nazgul
              })

              if (studentIndex === -1) {
                students.push(nazgulFrame)
              } else {
                let alarm = students[studentIndex].alarm == true || nazgulFrame.alarm == true

                if (nazgulFrame.create_time > students[studentIndex].create_time) {
                  students[studentIndex] = nazgulFrame
                }

                students[studentIndex].alarm = alarm
              }
            })

            context.dispatch('updateStudents')

            context.commit('UPDATE_STUDENTS', students)
            context.commit('LOADING', false)

            resolve()
          })
          .catch(() => {
            context.commit('ERROR', 'Nie udało się pobrać listy studentów')
            context.commit('LOADING', false)
            reject()
          });
        context.commit('LOADING', false)
        resolve()
      })
    },
    chooseStudent(context, selectedStudent) {
      return new Promise((resolve, reject) => {
        let studentIndex = context.state.students.findIndex(student => {
          return student.nazgul === selectedStudent.nazgul
        })

        context.commit('CHANGE_STUDENT', studentIndex)
      })
    },
    updateStudents(context){
      setInterval(() => {
        return new Promise((resolve, reject) => {
          context.commit('LOADING', true)

          axios.get("http://www.iraminius.pl/sauron/api/screenshotlist",{
            headers: {'Authorization': window.sessionStorage.getItem('Authorization')},
            params:{
                time_from: (Date.now() / 1000 - 7200 - 10).toFixed(0),
                time_to: (Date.now() / 1000 - 7200).toFixed(0),
                group: this.state.room,
                nazgul: this.state.student.nazgul,
                newest: true
            }
          }).then(res=>{
            console.log(res)
          })

          axios
            .get("http://www.iraminius.pl/sauron/api/process", {
              headers: {'Authorization': window.sessionStorage.getItem('Authorization')},
              params:{
                time_from: (Date.now() / 1000 - 7200 - 10).toFixed(0),
                time_to: (Date.now() / 1000 - 7200).toFixed(0),
                group: this.state.room
              }
            })
            .then(res => {
              let students = context.state.students.map(student => {
                return student
              })

              res.data.forEach(nazgulFrame => {
                let studentIndex = students.findIndex(student => {
                  return student.nazgul === nazgulFrame.nazgul
                })

                if (studentIndex === -1) {
                  students.push(nazgulFrame)
                } else {
                  let alarm = students[studentIndex].alarm == true || nazgulFrame.alarm == true

                  if (nazgulFrame.create_time > students[studentIndex].create_time) {
                    students[studentIndex] = nazgulFrame
                  }

                  students[studentIndex].alarm = alarm
                }
              })
              context.commit('UPDATE_STUDENTS', students)
              context.commit('LOADING', false)
              resolve()
            })
            .catch(() => {
              context.commit('ERROR', 'Nie udało się uaktualnić listy procesów')
              context.commit('LOADING', false)
              reject()
            });
          context.commit('LOADING', false)
          resolve()
        })
      }, 5000)
    }
  }
})
