
import React from 'react';
import { IonPage, withIonLifeCycle } from '@ionic/react';
import { withRouter } from 'react-router-dom';
import { isAccessHope } from '../../../referrers';
import { Header, Tabs } from '../../../common';
import globalVars from '../../../globalVars';
import General from './general';
import Profile from './profile';
import './styles.scss';

class SettingsComponent extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = { profile: null }
    this.mounted = null;
  }

  redirectToLogin = () => {
    this.props.history.push('/login');
  }

  getSettingsTabsList() {
    const settingsTabList = [
      {
        tabLabel: {
          name: isAccessHope() ? "My AccessHope" : "General",
          class: 'general-class',
        },
        tabDataComponent: {
          name: General,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 0,
            isSubTab: 0
          }
        }
      },
      {
        tabLabel: {
          name: isAccessHope() ? "My Info" : "Profile",
          class: 'profile-class',
        },
        tabDataComponent: {
          name: Profile,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 1,
            isSubTab: 0
          }
        }
      }
    ];
    return settingsTabList;
  }

  ionViewDidEnter() {
    window.alertShownCounter = 0;
    document.title = "Settings";
  }

  render() {

    const settingsTabList = this.getSettingsTabsList();
    return (
      <IonPage>
          <Header title='Settings' />
          <Tabs
            wrapperClass="settings-tabs"
            tabObj={{currentTabIndex:0, parentTabIndex:0, isSubTab: 0}}
            data={settingsTabList}
            type="settings"
          />

      </IonPage>
    )
  }
}

export default withRouter(withIonLifeCycle(SettingsComponent));
