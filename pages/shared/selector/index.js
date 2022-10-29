import React from 'react';
import {
  IonApp, IonContent, IonImg, IonAlert,
  IonGrid, IonRow, IonCol, IonLoading,
  withIonLifeCycle
} from '@ionic/react';
import { withRouter, Redirect } from 'react-router-dom';
import { Header } from '../../../common';
import { selectorScreenLogos } from '../../../stubs/logo';
import { poemLogo as PoemLogo } from '../../../assets/images';
import globalVars from '../../../globalVars';
import './styles.scss';



class SelectorScreen extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showAlert: false,
      redirect: false,
      showLoading: true
    };
  }

  setReferrer = (referrer, type) => {
    this.referrer = type;
    window.location = `/login?referrer=${referrer}&type=${type}`;
  }

  componentDidMount() {
    this.setState({
      showLoading: false
    })
  }

  // ionViewDidEnter() {
  //   this.setState({
  //     showLoading: false
  //   })
  // }

  render() {

    return (
      <IonApp className="selector-screen-container">
        { /* <Header /> */}
        <IonContent  className="selector-screen-content-container">
          <div className="org-list">
            <IonGrid>
            {
              !this.state.showLoading && selectorScreenLogos().map((item, index) => (
                <IonRow
                  className={`organisation-item ${item.type}`}
                  key={`selector_index_${index}`}
                  onClick={(e) => this.setReferrer(item.referrer, item.type)}
                >
                  {item.src && <div className="ion-img"><img src={item.src} alt={item.alt} /></div>}
                  {item.logoText && <PoemLogo /> }
                  <div className="selector-text-content" style={{ color: item.color}}>Log in as {item.type.toUpperCase()} expert</div>
                </IonRow>
              ))
            }
            </IonGrid>
          </div>
        </IonContent>
        <IonLoading isOpen={this.state.showLoading} />
      </IonApp>
    );
  }
}

export default withIonLifeCycle(SelectorScreen);
