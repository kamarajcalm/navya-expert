
import React from 'react';
import {
  IonList, IonItem, IonLabel, IonContent,
  IonAlert, IonLoading
} from '@ionic/react';
import { withRouter, Redirect } from 'react-router-dom';
import { Plugins } from '@capacitor/core';
import { isApollo } from '../../../referrers';
import api from '../../../api/endpoints';
import About from './about';
import ExpertUnavailability from './expertunavailability';
import { getAlertTitle, hasSurveyAccess } from '../../../utils';
import './styles.scss';
import { isAccessHope } from '../../../referrers';

class General extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      redirectURL: false,
      showLoading: false,
      showAlert: false
    }
  }

  logout = async () => {
    // const info = await Plugins.Device.getInfo();
    api.logout(window.localStorage.getItem('deviceID'));
  }

  loginAsExpert = () => {
    this.setShowAlert(true)
  }

  // cancelPopup = () => {
  //   this.setState({
  //     openLoginAsExpertPopup: false
  //   });
  // }

  callApi = async (username) => {
    this.setState({
      showLoading: true
    }, async () => {
      const response = await api.loginAsExpert(username);
      console.log('loginAsExpert response')
      console.log(response);

      this.setState({
        showLoading: false
      }, async () => {
        if(response.error) {
          await Plugins.Modals.alert({title: getAlertTitle(), message: response.error});
        } else {
          if (response && response.userid) {
            let locationHref= "/user/home";
            window.location = locationHref;
          }
        }
      });
    });
  }

  setShowLoading = (flag) => {
    this.setState({
      showLoading: flag
    })
  }

  setShowAlert = (flag) => {
    this.setState({
      showAlert: flag
    })
  }

  render() {

    const hasDebugAccess = window.localStorage.getItem('has_debug_access') == 1;

    return(
      <div>
        <div className="general-container">
          <IonList>
            <IonItem>
              <IonLabel>{isAccessHope() ?
                <a href="mailto:AHExpertSupport@myaccesshope.org" target="_top">Email AccessHope Support</a>
                :
                <a href="mailto:navya@navyatech.in?Subject=Support" target="_top">Email Navya Support</a>
              }
              </IonLabel>
            </IonItem>
            {!isApollo() && <IonItem>
              <About />
            </IonItem>
            }
           {hasSurveyAccess() && !isAccessHope() && <ExpertUnavailability />}
           {hasDebugAccess && <IonItem onClick={this.loginAsExpert}>
              <IonLabel>Log In as Expert</IonLabel>
            </IonItem>
           }

            <IonItem onClick={this.logout}>
              <IonLabel>Log Out</IonLabel>
            </IonItem>
          </IonList>
        </div>


        <IonAlert
          isOpen={this.state.showAlert}
          onDidDismiss={() => this.setShowAlert(false)}
          header={'Enter Expert Username!'}
          inputs={[
            {
              name: 'uname',
              type: 'text',
              placeholder: 'Username'
            }
          ]}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                console.log('cancelled');
                // this.cancelPopup();
              }
            },
            {
              text: 'OK',
              handler: (data) => {
                this.callApi(data.uname);
              }
            }
          ]}
        />

        <IonLoading
          isOpen={this.state.showLoading}
          onDidDismiss={() => this.setShowLoading(false)}
          message={'Please wait...'}
        />
      </div>
    );
  }
}

export default withRouter(General);
