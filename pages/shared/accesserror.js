

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';;
import CommonInlinePageError from '../../commoninlinepageerror';
import TokenManager from '../../api/tokenManager';

class AccessError extends React.PureComponent {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    setTimeout(() => {
      new TokenManager().clearToken();
      window.location.href = '/login';
    }, 3000);
  }

  render() {
    return (
      <CommonInlinePageError message={"Access Permissions are needed"} />
    );
  }
}

export default AccessError;
