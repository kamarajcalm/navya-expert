import React from 'react';
import { IonLabel, IonContent } from '@ionic/react';
import { Header, Modal } from '../../../common';
import { AboutNavya } from './about_navya';
import api from '../../../api/endpoints';
import './styles.scss';
import { isAccessHope } from '../../../referrers';

class About extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      showAlert: false
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
    await api.forgotPassword(values)
    hideLoader(false);
    this.setState({ isOpen: false }, () => {
      this.setState({showAlert: true});
    });
  }

  render() {

    return (
      <React.Fragment>
          <IonLabel onClick={this.toggleModal}>
            {isAccessHope()?'About AccessHope':"About ExpertApp"}
          </IonLabel>
          <Modal
            isOpen={this.state.isOpen}
          >
          <Header title="About"><span className="close-btn" onClick={this.toggleModal}>Cancel</span></Header>
          <IonContent scrollEvents={true}>
            <AboutNavya />
          </IonContent>
          </Modal>
      </React.Fragment>
    );
  }
}

export default About;
