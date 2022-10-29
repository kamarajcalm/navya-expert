import React from 'react';
import {
  IonInput, IonButton, IonItem, IonLoading, IonAlert
} from '@ionic/react';
import './styles.scss';

class FormComponent extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showLoading: false,
      showAlert: false,
      errorMessage: null
    }
    this.formData = {};
  }

  componentDidMount() {
    if (this.state.showLoading) {
      this.setShowLoading(false);
    }
  }

  setShowHideAlert = (flag, message) => {
    this.setState({
      showAlert: flag,
      errorMessage: message
    });
  }

  formSubmit = (e) => {
    e.preventDefault();
    const items = this.props.items;
    let errorFlag = false;

    // if (Object.keys(this.formData).length === 0) {
    //   errorFlag = true;
    // } else {
      for (let c = 0; c < items.length; c++) {
        const item = items[c];
        console.log('item : ',item);
        if (item.required) {
          if (!!this.formData[item.name] === false) {
            errorFlag = true;
          }
        }
      }
    // }

    if (errorFlag && window.alertShownCounter === 0) {
      this.setShowHideAlert(true, this.props.errorMessage);
    } else {
      this.setState({
        showLoading: true
      }, () => {
        this.props.onSubmit(this.formData, this.setShowLoading, this.setShowHideAlert);
      });
    }

  }

  setShowLoading = (flag) => {
    this.setState({
      showLoading: flag
    })
  }

  addDataToFormFields = (e, name) => {
    this.formData[name] = e.target.value;
  }

  renderInput = (props, index) => {
    return (
      <IonItem key={`${this.props.formname}_${index}`}>
        <IonInput
          {...props}
          onBlur={(e) => this.addDataToFormFields(e, props.name)}
          onKeyPress={(e) => { if (e.which === 13) this.addDataToFormFields(e, props.name) } }
        />
      </IonItem>
    );
  }

  renderText = (item) => {
    return (
      <p className="text">{item.text}</p>
    );
  }

  renderButton = (item, props) => {
    return (
      <IonButton className="button" id={`${props.className}-button`} {...props}>{item.text}</IonButton>
    );
  }

  renderSubmitButton = (item, props) => {
    return (
      <IonButton className="submit-button" id={`${props.className}-submit`} {...props} onClick={this.formSubmit}>{item.text}</IonButton>
    );
  }

  getFormFields = () => {
    const { items, ...props } = this.props;
    const formFields = items.map((item, index) => {
      switch(item.type) {
        case 'input':
        case 'password':
          return this.renderInput(item, index);
        case 'text':
          return this.renderText(item);
        case 'button':
          return this.renderButton(item, props);
        case 'submit':
          return this.renderSubmitButton(item, props);
      }
    });
    return formFields;
  }

  render() {
    const {
      items, onSubmit, loadingMessage=null, className=''
    } = this.props;

    return (
      <form ref={node => this.form = node} method="post" noValidate className={`${className} form-container`} onSubmit={this.formSubmit}>
        {this.getFormFields()}
        <input type="submit" key={`${className}_hiddenSubmit`} style={{ 'position':'absolute', 'left': '-10000px' }} />
        <IonLoading
          isOpen={this.state.showLoading}
          onDidDismiss={() => this.setShowLoading(false)}
          message={loadingMessage}
        />
        <IonAlert
          isOpen={this.state.showAlert}
          onDidDismiss={() => this.setShowHideAlert(false, false)}
          message={this.state.errorMessage}
          buttons={this.props.buttons}
        />

      </form>
    )
  }
}

export default FormComponent;
