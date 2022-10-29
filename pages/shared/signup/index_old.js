import React from 'react';
import { IonAlert } from '@ionic/react';
import { Header, Modal, Form } from '../../../common';
import { getSignupStub } from '../../../stubs/forms';
import globalVars from '../../../globalVars';
import './styles.scss';
import api from '../../../api/endpoints';

class Signup extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      showAlert: false,
      alertMsg: null
    }
    this.formData = {};
  }

  toggleModal = () => {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  onDidDismiss = () => {
    this.setState({
      showAlert: true
    });
  }

  hideAlert = () => {
    this.setState({
      showAlert: false
    });
  }

  onFormSubmit = async (values, hideLoader) => {
    this.formData = {...values};
    let response = await api.requestSignup(this.formData.email);
    console.log(response);
    let msg = '';
    if(response.success) {  
      msg = response.success;
    } else {
      msg = response.error;
    }

    hideLoader(false);
    this.setState({ isOpen: false }, () => {
      this.setState({showAlert: true, alertMsg: msg});
    });
  }

  render() {

    return (
      <React.Fragment>
        <div className="signup-container">
        <div className="link-container">
          <span>Don't have an account?</span><span className="link" onClick={this.toggleModal}>Request Access</span>
        </div>
          <Modal
            isOpen={this.state.isOpen}
          >
            <Header title="Signup Help"><span className="close-btn" onClick={this.toggleModal}>Cancel</span></Header>
            <Form
              className="signup-form"
              formname="signup"
              items={getSignupStub()}
              onSubmit={this.onFormSubmit}
              loadingMessage={'Please wait'}
              errorMessage={'Please enter an emailid'}
              buttons={[
                {
                  text: 'OK', 
                  role: 'cancel',
                  cssClass: 'navyaPink'
                }
              ]}
            />  
          </Modal>
          <IonAlert
            isOpen={this.state.showAlert && globalVars.getNetworkStatus()}
            onDidDismiss={this.hideAlert}
            message={this.state.alertMsg}
            buttons={[
              {
                text: 'OK',
                role: 'cancel',
                cssClass: 'navyaPink'
              }
            ]}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default Signup;
