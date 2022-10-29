
import React from 'react';
import { IonModal } from '@ionic/react';
import slideInVerticalUp from '../../animations/slideinverticalup';
import slideOutVerticalDown from '../../animations/slideoutverticaldown';
import './styles.scss';

class Modal extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }
  }

  render() {
    const {
      isOpen, enterAnimation, leaveAnimation,
      onDidDismiss, animated, ...props
    } = this.props;
    return (
      <IonModal
        isOpen={isOpen}
        enterAnimation={enterAnimation || slideInVerticalUp}
        leaveAnimation={leaveAnimation || slideOutVerticalDown}
        onDidDismiss={onDidDismiss || function(){}}
        className={this.props.className || 'modal-container'}
        {...props}
      >
        {this.props.children}
      </IonModal>
    );
  }
}

export default Modal;
