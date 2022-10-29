
import React from 'react';
import { IonHeader, IonToolbar } from '@ionic/react';
import cx from 'classnames';
import './styles.scss';

class Header extends React.PureComponent {

  constructor(props) {
    super(props);
  }

  render() {

    const isInDebugMode = window.localStorage.getItem('is_in_debug_mode') == 1;

    return (
      <IonHeader className="page-header-container">
        <IonToolbar className={cx({"navya-pink": !this.props.noColor })}>
            {this.props.title && <span className="page-header-title">{!isInDebugMode ? this.props.title : this.props.title + ' (Debug)'}</span>}
          {this.props.children}
        </IonToolbar>
      </IonHeader>
    )
  }
}

export default Header;
