const Observable = require('rx-lite').Observable;
const Datastore = require('@google-cloud/datastore');
const deepmerge = require('deepmerge');

const KIND = 'FlowchatStoreGcdState';

module.exports = class FlowchatStoreGcd {

  constructor(projectId, credentials, initialState) {
    this._ds = Datastore({
      projectId,
      credentials
    });

    this._initialState = initialState;

    this.getState = this._getState.bind(this);
    this.storeState = this._storeState.bind(this);
  }

  _getInitialState() {
    return JSON.parse(JSON.stringify(this._initialState));
  }

  _getState({ data, state, sessionId }) {
    const promise = new Promise(resolve => {
      const key = this._ds.key([KIND, sessionId]);
      this._ds.get(key, (err, entity) => {
        let restoredState;
        if (err || !entity) {
          restoredState = this._getInitialState();
         } else {
          restoredState = deepmerge.all([{}, this._getInitialState(), JSON.parse(entity.state)]);
         }
        resolve({ data, state: restoredState, sessionId });
      });
    });
    return Observable.fromPromise(promise);
  }

  _storeState({ state, sessionId, wait }) {
    wait(new Promise(resolve => {
      const key = this._ds.key([KIND, sessionId]);
      const data = {
        state: JSON.stringify(state)
      };
      this._ds.save({
        key,
        data
      }, (err) => {
        // TODO: report error if happens
        resolve();
      });
    }));
  }

  _findKey(sessionId) {

  }

};
