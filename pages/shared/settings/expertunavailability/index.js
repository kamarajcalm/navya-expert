import React from 'react';
import {
  IonList, IonItem, IonLabel,
  IonAlert, IonLoading, IonDatetime,
  IonItemDivider, IonButton, IonTextarea
} from '@ionic/react';
import cx from 'classnames';
import { withRouter, Redirect } from 'react-router-dom';
import { Plugins } from '@capacitor/core';
import { isApollo } from '../../../../referrers';
import api from '../../../../api/endpoints';
import { isDebug, getUTCDateTime, getLocalDateTime, addZeroPrefix } from '../../../../utils';
import './styles.scss';
import { isAccessHope } from '../../../../referrers';

const Mandatory = () => {
  if (isDebug()) return null;
  return (
    <span className="mandatory">*</span>
  );
}

class ExpertUnavailability extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showLoading: false,
      showFields: false,
      showAlert: false,
      start_date: null,
      end_date: null,
      reason: null,
      start_time: null,
      end_time: null,
      showStartTime: false,
      showEndTime: false,
      render: false
    }
    this.isDebug = isDebug();
    this.formValues = {};
  }

  getDateTimeFromAPI = (date) => {
    const arr = date.split(' ');
    let time;
    if (arr[1] !== '') {
      time = arr[1];
    }
    return { date: arr[0], time: arr[1] || '' };
  }

  showDateTimeFields = (e) => {
    this.setState({
      showFields: !this.state.showFields
    }, () => {
      if (this.state.showFields) {
        this.setState({
          showLoading: true
        }, async() => {
          const data = await api.expertUnavailability({type: "get"});
          let { start_date=null,  end_date=null, reason='' } = data || {};
          let start_time=''; let end_time='';
          if (start_date) {
            const obj = this.getDateTimeFromAPI(getLocalDateTime(start_date));
            start_date = obj.date; start_time = obj.time;
          }
          if (end_date) {
            const obj = this.getDateTimeFromAPI(getLocalDateTime(end_date));
            end_date = obj.date; end_time = obj.time;
          }
          this.setState({
            showLoading: false,
            start_date,  end_date, start_time,
            end_time, reason,
            showStartTime: !!start_time,
            showEndTime: !!end_time,
          }, () => {
            this.formValues = {start_date, end_date, start_time, end_time, reason};
            this.initFormValues = {...this.formValues};
          });

        });
      }
    })
  }

  setTimeFromSelectedDate = (obj, type, val) => {
    const focussed = this.focussed;
    this.focussed = false;
    if (!focussed) {
      return;
    }
    const dateObj = new Date();
    let day = addZeroPrefix(+dateObj.getDate());
    let month = addZeroPrefix(+dateObj.getMonth() + 1);
    let year = dateObj.getFullYear();
    let hours = addZeroPrefix(+dateObj.getHours());
    let minutes = addZeroPrefix(+dateObj.getMinutes());
    let todaysDate = `${year}-${month}-${day}`;
    if (type === 'start_date') {
      // check for todays date.
      if (obj[type] === todaysDate) {
        // if true set start_time as current system time
        obj['start_time'] = `${hours}:${minutes}`;
      } else {
        if ((new Date(obj[type])).getTime() < dateObj.getTime()) {
          obj[type] = todaysDate;
          this.focussed = true;
          this.setTimeFromSelectedDate(obj, type, todaysDate);
        } else {
          // if false set start_time as 00.00;
          obj['start_time'] = `00:00`;
        }
      }
    } else if (type === 'end_date') {
      obj['end_time'] = '23:59';
    } else if (type === 'start_time') {
      // if true set start_time as current system time
      if (+obj[type].trim().split(":").join('') <= +`${hours}${minutes}`) {
        if (this.formValues.start_date === todaysDate)
          obj['start_time'] = `${hours}:${minutes}`;
      }
    }
  }

  setDateTime = (type, val, isDate=false) => {
    if (!val) return;
    const obj = {};
    let value = val.split("T")[isDate ? 0 : 1];
    // set time if condition
    if (value && !isDate) {
      const valArr = value.split(":");
      value = `${valArr[0]}:${valArr[1]}`;
    }
    obj[type] = value || val;


    // setting default time if only date is selected.
    this.setTimeFromSelectedDate(obj, type, val);
    console.log('obj : ',obj);
    this.setState({...obj, render: !this.state.render}, () => {
      console.log('this.state.start_time : ',this.state.start_time);
      for(let c in obj) {
        this.formValues[c] = obj[c];
      }

      console.log('this.formValues : ',this.formValues);

    });
  }

  setShowLoading = (param) => {
    this.setState({
      showLoading: param
    })
  }

  setShowHideAlert = (param) => {
    this.setState({
      showAlert: param
    })
  }

  isFormDataChanged = () => {
    for(let c in this.initFormValues) {
      if (this.formValues[c]) {
        if (this.initFormValues[c] !== this.formValues[c]) {
          return true;
        }
      }
    }
    return false;
  }

  submitExpertDates = async() => {
    const start_date = this.start_date.value ? this.start_date.value.split('T')[0] : null;
    const end_date = this.end_date.value ? this.end_date.value.split('T')[0] : null;
    console.log('this.formValues : ',this.formValues);
    const validFnBool = this.validate();
    const isValid = !this.isDebug ? validFnBool && this.isFormDataChanged() : false;
    if (isValid) {
      this.setState({
        showLoading: true,
        showAlert: false
      }, async () => {
        await this.callAPI({type: 'post'});
      });

    } else {
      if (this.errorMessage === "") {
        this.errorMessage = this.isDebug ? "You can't submit since you're in debug Mode !" : "Modify any of the values to submit";
      }
      if (this.errorMessage) {
        this.setState({
          errorMessage: this.errorMessage,
          showAlert: true
        });
      }
    }
  }

  callAPI = async (typeObj) => {
    const {start_date="", end_date="", start_time="", end_time="", reason=""} = this.formValues;
    let apiStartDate = getUTCDateTime(`${start_date} ${start_time}`);
    let apiEndDate = getUTCDateTime(`${end_date} ${end_time}`);
    const apiParams = {
      start_date: apiStartDate,
      end_date: apiEndDate,
      reason,
      ...typeObj
    };
    const data = await api.expertUnavailability(apiParams);
    this.setState({
      showLoading: false,
      showAlert: true,
      errorMessage: 'Your details are successfully submitted !'
    }, () => {
      this.errorMessage = '';
    });
  }

  callDelAPI = () => {
    const obj = {start_date: "", end_date: "", start_time: "", end_time: ""};

    this.setState(obj, async () => {
      this.formValues = {};
      await this.callAPI({type: "del"});
    });
  }

  isEndDateLessThanStartDate = () => {
    const formValues = this.formValues;
    console.log('formValues : ',formValues);
    return (new Date(formValues.end_date)).getTime() < (new Date(formValues.start_date)).getTime();
  }

  isEndTimeLessThanStartTime = () => {
    const formValues = this.formValues;
    if (formValues.start_date === formValues.end_date) {
        const startTimeFormVals = formValues.start_time.split(":");
        const start_time = [startTimeFormVals[0], startTimeFormVals[1]].join('') * 1;
        const endTimeFormVals = formValues.end_time.split(":");
        const end_time = [endTimeFormVals[0], endTimeFormVals[1]].join('') * 1;
        return end_time <= start_time;
    }
    return false;
  }

  validate = () => {
    const formValues = this.formValues;
    console.log('formValues : ',formValues);
    let errorMessage = "";
    if (!formValues["start_date"] && !formValues["end_date"]) {
      errorMessage = 'Select Expert Unavailability Start Date and End Date';
    } else if (!formValues['start_date']) {
      errorMessage = 'Select Expert Unavailability Start Date';
    } else if (!formValues['end_date']) {
      errorMessage = 'Select Expert Unavailability End Date';
    } else if (this.isEndDateLessThanStartDate()) {
      errorMessage = 'Expert Unavailability End date should be greater than or equal to the Start date';
    } else if (this.isEndTimeLessThanStartTime()) {
      errorMessage = "Selected dates are equal. Hence the End Time should always be greater than the Start Time";
    }
    this.errorMessage = errorMessage;

    return (errorMessage === '');
  }

  showTimeFieldCb = (param) => {
    const obj = {};
    obj[param] = true;
    this.setState(obj);
  }

  setReason = value => {
    const obj = {};
    obj['reason'] = value;
    this.setState(obj, () => {
      this.formValues['reason'] = value;
    });
  }

  render() {

    return(
      <React.Fragment>
      <div className={cx('expert-availability-container', {show: this.state.showFields, "is-debug": this.isDebug})}>

      <IonItemDivider className="date-fields-heading" button onClick={(e) => this.showDateTimeFields(e)}>
        <IonLabel className="main-label">
          <span>{isAccessHope()?'Unavailable Dates':'Expert Unavailablity'}</span>
        </IonLabel>
        {
          this.state.showFields && !this.isDebug &&
          (
            <IonButton onClick={this.callDelAPI} className="reset-availability">Reset</IonButton>
          )
        }

      </IonItemDivider>
        <IonItem className="show-hide-field">
          <IonLabel>Start Date <Mandatory /></IonLabel>
          <IonDatetime placeholder="Select" onIonFocus={() => {this.focussed = true}} onIonChange={e => this.setDateTime('start_date', this.start_date.value, true)} onClick={(e) => this.showTimeFieldCb('showStartTime')} ref={node => this.start_date = node} value={this.state.start_date} displayFormat="MMM D, YYYY" />
        </IonItem>
        {
          this.state.showStartTime &&
          <IonItem className="show-hide-field">
            <IonLabel>Start Time</IonLabel>
            <IonDatetime placeholder="Select" onIonFocus={() => {this.focussed = true}} onIonChange={e => this.setDateTime('start_time', this.start_time.value)} value={this.state.start_time} ref={node => this.start_time = node} displayFormat="h:mm a" />
          </IonItem>
        }
        <IonItem className="show-hide-field">
          <IonLabel>End Date <Mandatory /></IonLabel>
          <IonDatetime placeholder="Select" onIonFocus={() => {this.focussed = true}} onIonChange={e => this.setDateTime('end_date', e.detail.value, true)} onClick={(e) => this.showTimeFieldCb('showEndTime')} ref={node => this.end_date = node} value={this.state.end_date} displayFormat="MMM D, YYYY" />
        </IonItem>
        {
          this.state.showEndTime &&
          <IonItem className="show-hide-field">
            <IonLabel>End Time</IonLabel>
            <IonDatetime placeholder="Select" ref={node => this.end_time = node} onIonChange={e => this.setDateTime('end_time', e.detail.value)} value={this.state.end_time} displayFormat="h:mm a" />
          </IonItem>
        }
        <IonItem className="show-hide-field" >
          <IonTextarea rows="3" ref={node => this.reasonVal = node} onIonBlur={e => this.setReason(this.reasonVal.value)} value={this.state.reason} placeholder="Comments" />
        </IonItem>
        <IonItem className="show-hide-field">
          <IonButton onClick={this.submitExpertDates}>Submit</IonButton>
        </IonItem>
        <IonLoading
          isOpen={this.state.showLoading}
          onDidDismiss={() => this.setShowLoading(false)}
        />
        <IonAlert
          isOpen={this.state.showAlert}
          onDidDismiss={() => this.setShowHideAlert(false)}
          message={this.state.errorMessage}
          buttons={[
            {
              text: 'OK',
              role: 'cancel',
              cssClass: 'navyaPink',
              handler: () => {
                this.setShowHideAlert(false)
              }
            }
          ]}
        />
      </div>
      </React.Fragment>
    );
  }
}

export default ExpertUnavailability;
