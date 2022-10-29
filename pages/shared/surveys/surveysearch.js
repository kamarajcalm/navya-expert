
import React from 'react';
import {
  IonIcon, IonSearchbar, IonContent,
  IonPage
} from '@ionic/react';
import cx from 'classnames';
import { withRouter } from 'react-router-dom';
import { Modal, Header } from '../../../common';
import { isAccessHope } from '../../../referrers';
import SurveysData from './surveysdata';
import slideInVerticalDown from '../../../animations/slideinverticaldown';
import slideOutVerticalUp from '../../../animations/slideoutverticalup';
import './styles.scss';

class SurveySearch extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      searchKey: ''
    }
  }

  toggleSearchModal = () => {
    this.setState({
      isOpen: !this.state.isOpen,
      surveysDataShown: false
    });
  }

  showSurveyDataSection = (event) => {
    const surveySearchBar = document.getElementById('survey-search-bar');
    if (surveySearchBar) {
      surveySearchBar.addEventListener('ionChange', this.getSearchData);
      this.setState({
        surveysDataShown: !this.state.surveysDataShown,
        searchKey: '',
      });
    }
  }

  componentDidMount() {
    window.addEventListener('ionModalDidPresent', this.showSurveyDataSection);
  }

  componentWillUnmount() {
    this.showSurveyDataSection();
    document.getElementById('survey-search-bar') && document.getElementById('survey-search-bar').removeEventListener('ionChange', this.getSearchData);
    window.removeEventListener('ionModalDidPresent', this.showSurveyDataSection);
  }

  getSearchData = (e) => {
    const value = e.target.value;
    if (value.length < 3 && value > 0) return;
    this.setState({
      searchKey: value
    });
  }

  render() {
    return (
      <div className={this.props.classNameValue}>
        <IonIcon className="search-bar" name='search' onClick={this.toggleSearchModal} />
        <Modal
          isOpen={this.state.isOpen}
          className={cx('search-modal-container', {'content-shown': (this.state.searchKey !== '') })}
          enterAnimation={slideInVerticalDown}
          leaveAnimation={slideOutVerticalUp}
        >

              <Header noColor>

                <IonSearchbar
                  showCancelButton="never"
                  debounce={300}
                  animated
                  placeholder={isAccessHope() ? "Search by Navya Survey ID" : "Search by Survey ID"}
                  className={this.props.classNameValue}
                  cancelButtonIcon={'search'}
                  id="survey-search-bar"
                  value={this.state.searchKey}
                >
                  <span className="modal-close" onClick={this.toggleSearchModal}>Cancel</span>
                </IonSearchbar>

              </Header>

            <IonContent scrollEvents={true}>
              {this.state.surveysDataShown && (
                <SurveysData
                  currentTab={'1'}
                  infiniteScrollID={'infinite-scroll-search'}
                  type={'search'}
                  searchKey={this.state.searchKey}
                  toggleSearchModal={this.toggleSearchModal}
                  suppressMessage
                  noResultsMessage={"No Results"}
                />
              )}
            </IonContent>
        </Modal>
      </div>
    )
  }
}

export default withRouter(SurveySearch);
