

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { Plugins } from '@capacitor/core';
import { Header } from './common';
import { isLoggedIn, isWeb } from './utils';

const CommonInlinePageError = (props) => {

  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="common-inline-page-error">
          <p>{props.message}</p>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default CommonInlinePageError;
