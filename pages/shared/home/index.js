
import React from 'react';
import {
  IonPage, IonLabel, IonBadge, IonItem,
  IonContent, IonList, IonListHeader, IonIcon,
  withIonLifeCycle, IonLoading, IonItemDivider
} from '@ionic/react';
import { withRouter } from 'react-router-dom';
import { Header } from '../../../common';
import getStubForHome from '../../../stubs/home';
import api from '../../../api/endpoints';
import globalVars from '../../../globalVars';
import { getTabSubTabData, hasSurveyAndDashboardAccess, hasOnlySurveyAccess, hasOnlyDashboardAccess } from '../../../utils';
import { getAvatarStyles } from '../../../styles/avatars';
import './styles.scss';
import { isAccessHope } from '../../../referrers';

class HomeComponent extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      dashboard_data: null,
      announcements: null,
      showLoading: true
    }

    this.dashboard_map = {
      'priority': 'priority',
      'done': 'completed',
      'new': 'pending',
      'awaiting': 'overdue',
      'experience engine': 'xe'
    }

    this.dashboard_mapAH = {
      'awaiting acceptance':'invited',
      'completed cases': 'completed',
      'awaiting review': 'pending',
      'awaiting': 'overdue',
      'experience engine': 'xe',
      'awaiting qc':'qc'
    }

  }

  ionViewDidEnter = async () => {

    window.alertShownCounter = 0;
    document.title = "Home";

    try {
      let [ dashboard_data, announcements ] = await Promise.all([
        api.dashboard(),
        api.getannouncements()
      ]);
      this.setState({
        dashboard_data,
        announcements,
        showLoading: false
      }, () => {
          if (dashboard_data && this.pendingCount !== dashboard_data.pending && window.Ionic.platforms[0] === "ios") {
            this.pendingCount = dashboard_data.pending;
          }

      });
    } catch(e) {
      this.setState({
        showLoading: false
      });
    }

  }

  redirectToSurveys = (currentTabIndex, parentTabIndex=0, isSubTab=0) => {
    globalVars.setSurveysTab({currentTabIndex, parentTabIndex, isSubTab});
    this.props.history.push('/user/surveys');
  }

  cbComponentTabs = (params) => {
    const {
      isSubTab, pIndex, cIndex, item
    } = params
    return (
        <IonItem
          data-key={`isSubTab_${isSubTab}_parentTabIndex_${pIndex}_currentIndex_${cIndex}`}
          key={`home_stub_${isSubTab}_${pIndex}_${cIndex}`}
          className="opt-list-item"
          onClick={() => this.redirectToSurveys(cIndex, pIndex, isSubTab)}
        >
            <i className={`${item.icon} icon`} />
            <IonLabel>{item.label}</IonLabel>
           {isAccessHope() ? <IonBadge>{this.state.dashboard_data && this.state.dashboard_data[this.dashboard_mapAH[item.label.toLowerCase()]]}</IonBadge> : <IonBadge>{this.state.dashboard_data && this.state.dashboard_data[this.dashboard_map[item.label.toLowerCase()]]}</IonBadge> }
            <ion-icon name="arrow-forward" />
        </IonItem>
    );
  }

  getHomeList = (homeStub) => {
    const data = getTabSubTabData({
      stubArray: homeStub, cbFn: this.cbComponentTabs
    });
    console.log('data : ',data);
    return data;
  }

  redirectToDashboard = () => {
    this.props.history.push('/user/dashboard');
  }

  render() {

    const homeStub = getStubForHome();
    let { announcements } = this.state;
    return (
      <IonPage>
        <Header title={'Home'} />

        {
          !this.state.showLoading &&
          <IonContent className="home-container" scrollEvents={true}>
            <IonList>
              <IonListHeader>
                <IonLabel>Today</IonLabel>
              </IonListHeader>

            { this.getHomeList(homeStub) }

            {
              hasSurveyAndDashboardAccess() && !isAccessHope() && (
                  <>
                    <IonListHeader className="header-section">
                        <IonLabel>Admin Panel</IonLabel>
                    </IonListHeader>
                    <IonItem className="dashboard-label" onClick={this.redirectToDashboard}>
                      <i className={`icon ion-arrow-graph-up-right medium ${isAccessHope()?'ah-dashboard-icon':'avatar-color'}`}  /><span>Dashboard</span>
                    </IonItem>
                  </>
              )
            }

              { !isAccessHope() && <IonListHeader className="notifications-header header-section">
                <IonLabel>Messages</IonLabel>
              </IonListHeader>
              }
              {
                !isAccessHope() && announcements && announcements.length > 0 && announcements.map((item, index) => (
                  <IonItem key={`messages_${index}`} className="notification-item">
                    <i className="icon navya-icon-bell medium" />
                    <span>{item.message}</span>
                  </IonItem>
                ))
              }
            </IonList>
          </IonContent>
        }
        <IonLoading isOpen={this.state.showLoading} />
      </IonPage>
    )
  }
}

export default withRouter(withIonLifeCycle(HomeComponent));
