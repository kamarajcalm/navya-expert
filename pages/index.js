import React from 'react';
import cx from 'classnames';
import { Redirect, Route, withRouter } from 'react-router-dom';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import getLoggedInRoutes from '../routes';
import { isLoggedIn, getRedirectURLOnAppLoad, hasNoSurveyAndNoDashboardAccess } from '../utils';

class ExpertsPages extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      render: false
    }
  }

  componentDidMount() {
    window.addEventListener('ionTabButtonClick', this.enableDisableTabs);
  }

  componentWillUnmount() {
    window.removeEventListener('ionTabButtonClick', this.enableDisableTabs);
  }

  enableDisableTabs = () => {
    // this.setState({
    //   render: !this.state.render
    // })
  }

  getPermissionFlag = (route) => {
    return route.hasPermission ? route.hasPermission() : true;
  }

  render() {
    const loggedInRoutes = getLoggedInRoutes();
    // const HomeComponent = loggedInRoutes ? loggedInRoutes.tabs[0].component : null;

    const routes = []; const tabs = [];

      loggedInRoutes.tabs.map((route, index) => {
        route.hideTabOptionCb && console.log('route.hideTabOptionCb : ',route.hideTabOptionCb());
        let permissionFlag = this.getPermissionFlag(route);
        if (permissionFlag) {
          tabs.push(
            <IonTabButton className={cx({'hide-tab-option': isLoggedIn() && route.hideTabOptionCb && route.hideTabOptionCb()})} key={`tab_bottom_${index}`} tab={route.path} href={route.path}>
              <IonIcon icon={route.icon} className={route.icon} />
              <IonLabel>{route.label}</IonLabel>
            </IonTabButton>
          );
        }
      });

      loggedInRoutes.routes.map((route, index) => {
        let permissionFlag = this.getPermissionFlag(route);
        if (permissionFlag) {
          routes.push(
            <Route
              path={route.path}
              render={props => <route.component {...props} />}
              exact={route.exact}
              key={`tab_route_${index}`}
            />
          )
        }
      });

    const redirectURL = getRedirectURLOnAppLoad();

    const DefaultRedirect = () => ([
      <Redirect exact from="/user" to={redirectURL}/>,
      <Redirect to={redirectURL || '/user/home'} />
    ]);

    return (
        <div className={cx({'hideTabs': isLoggedIn() && hasNoSurveyAndNoDashboardAccess()})}>
        {
          isLoggedIn() ? <IonReactRouter>
            {tabs.length == 0 ?
              <IonRouterOutlet>
              {routes}
              <DefaultRedirect />
            </IonRouterOutlet>
            :
            <IonTabs>
              <IonRouterOutlet>
                {routes}
                <DefaultRedirect />
              </IonRouterOutlet>
              <IonTabBar slot="bottom">
                {tabs}
              </IonTabBar>
            </IonTabs>}
          </IonReactRouter> : <Redirect to={redirectURL} />

        }
        </div>
    );
  }
}
export default withRouter(ExpertsPages);
