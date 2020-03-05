import { asPromise } from '../utils/handlers';
import RemoteCommentStorage from './remote';
const Axios = require('axios');

export default class OAuthCommentStorage extends RemoteCommentStorage {

    constructor(baseURL, accessToken) {
        super(baseURL);
        this.accessToken = accessToken;
    }

    createAxios = () => {
        const axios = Axios.create({
            baseURL: this.baseURL,
        });
        const accessToken = this.accessToken;
        axios.interceptors.request.use(function(config) {
            config.headers.Authorization = 'Bearer ' + accessToken;
            return config;
        });
        return axios;
    }

    onPreConnect = () => {
        return (
            asPromise(this.getAccessToken)
                .then((accessToken) => {
                    this.accessToken = accessToken;
                })
        );
    }

    getAccessToken = () => {
        return this.accessToken;
    }

}
