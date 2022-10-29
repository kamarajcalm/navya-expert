
import React from 'react';

import { IonPage } from '@ionic/react';

class Error404 extends React.PureComponent {

  render() {

    return (
      <IonPage>
        <div style={{textAlign: "center", margin: "30px"}}>
          <h1 style={{fontSize: "30px", margin: "auto"}}>404 Not Found</h1>
        </div>
      </IonPage>
    );
  }
}

export default Error404;
