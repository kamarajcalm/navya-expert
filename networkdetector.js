
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { Plugins } from '@capacitor/core';
import { Header } from './common';
import CommonInlinePageError from './commoninlinepageerror';
import { isLoggedIn, isWeb } from './utils';

export default function (ComposedComponent) {

  class NetworkDetector extends React.PureComponent {

    constructor(props) {
        super(props);
    }

    state = {
      isDisconnected: false
    }

    componentDidMount() {
      this.handleConnectionChange();
      window.addEventListener('online', this.handleConnectionChange);
      window.addEventListener('offline', this.handleConnectionChange);
      window.addEventListener('visibilitychange', this.setLogin);
    }

    componentWillUnmount() {
      // this.unlisten();
      window.removeEventListener('online', this.handleConnectionChange);
      window.removeEventListener('offline', this.handleConnectionChange);
      window.removeEventListener('visibilitychange', this.setLogin);
      window.removeEventListener('popstate', this.routeChanged);
    }

    setLogin = () => {
      if (!isLoggedIn() && isWeb() && window.location.pathname.indexOf('/resetpassword') === -1
          && window.location.pathname.indexOf('login') === -1) {
        window.location = '/login';
      }
    }

    handleConnectionChange = async () => {
      // debugger;
      const networkStatusCap = await Plugins.Network.getStatus();
      // const condition = navigator.onLine ? 'online' : 'offline';
      const condition = networkStatusCap.connected;
      // if (condition === 'online') {
      this.setState({
        isDisconnected: !condition
      });
    }

    render() {
      const { isDisconnected } = this.state;
      return (
        <React.Fragment>
          { isDisconnected ?
            <CommonInlinePageError message={'Connect your device to the internet and try again'} /> :
            <ComposedComponent {...this.props} />
          }

        </React.Fragment>
      );
    }
  }

  return NetworkDetector;
}
