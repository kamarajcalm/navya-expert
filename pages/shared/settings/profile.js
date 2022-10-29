
import React from 'react';
import { withIonLifeCycle, IonLoading, IonItem } from '@ionic/react';
import ResetPassword from './resetpassword';
import { isDebug, getLocalDateTime } from '../../../utils';
import { isMSKCC, isPM, isAccessHope } from '../../../referrers';
import api from '../../../api/endpoints';
import './styles.scss';

class Profile extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = { profile: null, showLoading: true }
  }

  componentDidMount = async () => {
    // window.alertShownCounter = 1;
    try {
      let profile_json = await api.getprofile();
      if (profile_json) {
        const {
          Expert_First_Name, Expert_Last_Name, Username,
          Email, Expert_Speciality, password_change_activity=null
        } = profile_json;

        let profile = {
          name: (Expert_First_Name && Expert_Last_Name) ? Expert_First_Name + ' ' + Expert_Last_Name : (Expert_First_Name ? Expert_First_Name : Expert_Last_Name),
          username: Username,
          email: Email,
          specialty: Expert_Speciality,
          password_change_activity
        }
        this.setState({
          profile,
          showLoading: false
        });
      }
    } catch(e) {
      console.log(e.message);
      this.setState({
        showLoading: false
      });
    } finally {
      this.setState({
        showLoading: false
      });
    }
  }

  render() {
    let {
      name=null, username=null, email=null, specialty=null,
      password_change_activity=null
    } = this.state.profile || {};

    return (
      <React.Fragment>
      {
        !this.state.showLoading &&
        [<div className="profile-container">
          { name && <div className="name">Name: {name} </div> }
          {!isMSKCC() && !isPM() && !isAccessHope() && username && <div className="user-name">Username: {username}</div> }
          { email && <div className="email">Email: {email}</div> }
          { specialty && <div className="specialty">Specialty: {this.state.profile.specialty}</div> }
          <ResetPassword />
        </div>,
        <React.Fragment>
        {
          isDebug() && password_change_activity &&
          <IonItem className="password-reset-message">Password was last changed by  {password_change_activity.source}. {password_change_activity.last_updated ? `Last Updated on ${getLocalDateTime(password_change_activity.last_updated)}` : '' }</IonItem>
        }</React.Fragment>]
      }
      <IonLoading isOpen={this.state.showLoading} />
      </React.Fragment>
    );
  }
}

export default withIonLifeCycle(Profile);
