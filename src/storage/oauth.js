'use strict';

const Axios = require('axios');

import {asPromise} from '../utils/handlers';

import RemoteCommentStorage from './remote';


export default class OAuthCommentStorage extends RemoteCommentStorage {

    constructor(baseURL, accessToken) {
        super(baseURL);
        this.accessToken = accessToken;
    }

    createAxios = () => {
        let axios = Axios.create({
            baseURL: this.baseURL
        });
        let accessToken = this.accessToken;
        axios.interceptors.request.use(function (config) {
            config.headers.Authorization = "Bearer " + accessToken;
            return config;
        });
        return axios;
    }

    onConnect = () => {
        return (
            asPromise(this.getAccessToken)
            .then((accessToken) => {
                this.accessToken = accessToken;
                this._timer = setInterval(this.sync, 5000);
            })
        );
    };

    getAccessToken = () => {
        return this.accessToken;
    }

}
